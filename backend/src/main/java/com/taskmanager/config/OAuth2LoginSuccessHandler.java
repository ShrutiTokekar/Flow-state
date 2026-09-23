package com.taskmanager.config;

import com.taskmanager.config.JwtTokenProvider;
import com.taskmanager.model.User;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.service.EmailService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Value("${frontend.url:https://flow-state-bay.vercel.app}")
    private String frontendUrl;

    @Autowired
    public OAuth2LoginSuccessHandler(JwtTokenProvider jwtTokenProvider, UserRepository userRepository,
                                     EmailService emailService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        
        // Extract user info from OAuth2 provider
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        
        // Only trust addresses Google has verified; otherwise someone could sign in as an
        // existing Flow State user by putting their email on an unverified Google account.
        if (email == null || !"true".equals(String.valueOf(attributes.get("email_verified")))) {
            response.sendRedirect(trimmed(frontendUrl) + "/login?error=google_email");
            return;
        }
        
        // Find or create user. All app emails go to this Google address.
        boolean[] isNew = {false};
        User user = userRepository.findByEmail(email).or(() -> userRepository.findByEmailIgnoreCase(email)).orElseGet(() -> {
            isNew[0] = true;
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name != null ? name : email.split("@")[0]);
            newUser.setPassword(""); // OAuth users don't have passwords
            newUser.setRole("USER");
            newUser.setEmailNotifications(true);
            newUser.setEmailVerified(true); // Google has already verified this address
            newUser.setCreatedAt(LocalDateTime.now());
            return userRepository.save(newUser);
        });
        
        if (isNew[0]) {
            emailService.sendWelcomeEmail(user.getEmail(), user.getName(), null);
        } else if (Boolean.FALSE.equals(user.getEmailVerified())) {
            // Signed up with a password earlier and never confirmed; signing in with Google proves the address.
            user.setEmailVerified(true);
            user.setVerificationTokenHash(null);
            user = userRepository.save(user);
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.currentTokenVersion());

        // The server-side session was only needed for the Google handshake; the app uses the token.
        var session = request.getSession(false);
        if (session != null) session.invalidate();

        // Hand the token to the app in the URL *fragment* (#...), which browsers never send to
        // servers, so it doesn't end up in server logs or Referer headers. The app removes it
        // from the address bar right away.
        String fragment = "token=" + enc(token) + "&email=" + enc(user.getEmail()) + "&name=" + enc(user.getName());
        response.sendRedirect(trimmed(frontendUrl) + "/auth/callback#" + fragment);
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private static String trimmed(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
