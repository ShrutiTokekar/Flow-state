package com.taskmanager.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.DefaultCorsProcessor;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-client rate limits, checked before Spring Security so floods are cut off before any
 * token checks or database work.
 *
 * The client address comes from request.getRemoteAddr(). With server.forward-headers-strategy
 * set to "native", Tomcat fills it in from X-Forwarded-For only when the request arrived through
 * a trusted internal proxy (the hosting load balancer), so clients can't fake it by sending
 * their own X-Forwarded-For header.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitFilter implements Filter {

    /** Limits per client address. Sensitive endpoints get their own, stricter bucket. */
    enum Rule {
        LOGIN(10, Duration.ofMinutes(1)),
        // These send email, so keep them tight to prevent using us to spam people
        REGISTER(5, Duration.ofHours(1)),
        RESEND_VERIFICATION(5, Duration.ofHours(1)),
        INVITES(30, Duration.ofHours(1)),
        VERIFY_EMAIL(20, Duration.ofMinutes(10)),
        GOOGLE_SIGN_IN(20, Duration.ofMinutes(1)),
        GENERAL(300, Duration.ofMinutes(1));

        final int capacity;
        final Duration period;

        Rule(int capacity, Duration period) {
            this.capacity = capacity;
            this.period = period;
        }

        static Rule forRequest(HttpServletRequest req) {
            String path = req.getRequestURI();
            boolean write = !"GET".equals(req.getMethod());
            if (path.startsWith("/api/auth/login")) return LOGIN;
            if (path.startsWith("/api/auth/register")) return REGISTER;
            if (path.startsWith("/api/users/me/resend-verification")) return RESEND_VERIFICATION;
            if (path.startsWith("/api/auth/verify-email")) return VERIFY_EMAIL;
            if (path.startsWith("/oauth2/") || path.startsWith("/login/oauth2/")) return GOOGLE_SIGN_IN;
            if (write && path.startsWith("/api/calendars/") && path.endsWith("/invites")) return INVITES;
            return GENERAL;
        }
    }

    private record Entry(Bucket bucket, long lastSeenMillis) {}

    static final int MAX_TRACKED_KEYS = 200_000;
    private final Map<String, Entry> buckets = new ConcurrentHashMap<>();
    private final CorsConfigurationSource corsSource;

    // Only for automated test runs that create many accounts from one address; always on in production
    private final boolean enabled;

    public RateLimitFilter(@Qualifier("corsConfigurationSource") CorsConfigurationSource corsSource,
                           @Value("${ratelimit.enabled:true}") boolean enabled) {
        this.corsSource = corsSource;
        this.enabled = enabled;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // CORS preflights carry no data and are answered by the CORS filter
        if (!enabled || "OPTIONS".equals(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        Rule rule = Rule.forRequest(req);
        String key = rule.name() + ":" + req.getRemoteAddr();
        if (buckets.size() >= MAX_TRACKED_KEYS) evictIdle(Duration.ofMinutes(5).toMillis());

        Bucket bucket = buckets.compute(key, (k, e) -> new Entry(
                e != null ? e.bucket() : newBucket(rule), System.currentTimeMillis())).bucket();

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            chain.doFilter(request, response);
        } else {
            long retrySeconds = Math.max(1, probe.getNanosToWaitForRefill() / 1_000_000_000L);
            // This runs before Spring Security's CORS handling; add CORS headers so the app can
            // read the 429 and show the message instead of a generic network error.
            CorsConfiguration cors = corsSource.getCorsConfiguration(req);
            if (cors != null) new DefaultCorsProcessor().processRequest(cors, req, res);
            res.setStatus(429);
            res.setHeader("Retry-After", String.valueOf(retrySeconds));
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Too many requests. Please wait a moment and try again.\"}");
        }
    }

    private static Bucket newBucket(Rule rule) {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(rule.capacity, Refill.intervally(rule.capacity, rule.period)))
                .build();
    }

    /** Drop buckets for clients we haven't seen recently so memory stays bounded. */
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void cleanup() {
        evictIdle(Duration.ofHours(1).toMillis() + 60_000);
    }

    private void evictIdle(long idleMillis) {
        long cutoff = System.currentTimeMillis() - idleMillis;
        buckets.entrySet().removeIf(e -> e.getValue().lastSeenMillis() < cutoff);
    }
}
