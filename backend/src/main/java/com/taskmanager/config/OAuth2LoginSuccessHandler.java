package com.taskmanager.config;

import com.taskmanager.config.JwtTokenProvider;
import com.taskmanager.model.User;
import com.taskmanager.repository.UserRepository;
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
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    
    @Value("${frontend.url:https://flow-state-bay.vercel.app}")
    private String frontendUrl;

    @Autowired
    public OAuth2LoginSuccessHandler(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
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
        
        if (email == null) {
            response.sendRedirect(frontendUrl + "/login?error=no_email");
            return;
        }
        
        // Find or create user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name != null ? name : email.split("@")[0]);
            newUser.setPassword(""); // OAuth users don't have passwords
            newUser.setRole("USER");
            newUser.setEmailNotifications(true);
            newUser.setCreatedAt(LocalDateTime.now());
            return userRepository.save(newUser);
        });
        
        // Generate JWT token
        String token = jwtTokenProvider.generateToken(email);
        
        // Build redirect URL with token and user info
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
                .queryParam("token", token)
                .queryParam("email", URLEncoder.encode(email, StandardCharsets.UTF_8))
                .queryParam("name", URLEncoder.encode(user.getName(), StandardCharsets.UTF_8))
                .build()
                .toUriString();
        
        response.sendRedirect(redirectUrl);
    }
}