package com.taskmanager.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Caps request bodies so one client can't tie up memory or a worker thread by sending
 * megabytes of JSON. Every API request here is small. Runs before everything else.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestSizeLimitFilter implements Filter {

    static final long MAX_BODY_BYTES = 256 * 1024;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        if (req.getContentLengthLong() > MAX_BODY_BYTES) {
            HttpServletResponse res = (HttpServletResponse) response;
            res.setStatus(413);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Request is too large.\"}");
            return;
        }
        // Bodies without a Content-Length (chunked) are counted as they're read instead
        chain.doFilter(req.getContentLengthLong() < 0 ? new LimitedRequest(req) : req, response);
    }

    private static final class LimitedRequest extends HttpServletRequestWrapper {
        LimitedRequest(HttpServletRequest request) {
            super(request);
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            ServletInputStream in = super.getInputStream();
            return new ServletInputStream() {
                private long count;

                @Override
                public int read() throws IOException {
                    int b = in.read();
                    if (b != -1 && ++count > MAX_BODY_BYTES) throw new IOException("Request body too large");
                    return b;
                }

                @Override
                public int read(byte[] buf, int off, int len) throws IOException {
                    int n = in.read(buf, off, len);
                    if (n > 0 && (count += n) > MAX_BODY_BYTES) throw new IOException("Request body too large");
                    return n;
                }

                @Override public boolean isFinished() { return in.isFinished(); }
                @Override public boolean isReady() { return in.isReady(); }
                @Override public void setReadListener(ReadListener listener) { in.setReadListener(listener); }
            };
        }
    }
}
