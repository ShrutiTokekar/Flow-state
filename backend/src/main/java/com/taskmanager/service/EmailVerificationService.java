package com.taskmanager.service;

import com.taskmanager.model.User;
import com.taskmanager.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/** Email confirmation links for accounts created with email + password. */
@Service
public class EmailVerificationService {

    static final Duration TOKEN_TTL = Duration.ofHours(48);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final EmailService emailService;

    public EmailVerificationService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /** Called right after sign-up: stores a fresh token and sends the welcome + confirm email. */
    @Transactional
    public void startVerification(User user) {
        String token = issueToken(user);
        emailService.sendWelcomeEmail(user.getEmail(), user.getName(), verifyUrl(token));
    }

    /** "Resend confirmation email" from the app. */
    @Transactional
    public void resend(User user) {
        if (!Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your email is already confirmed");
        }
        LocalDateTime last = user.getVerificationSentAt();
        if (last != null && last.plus(RESEND_COOLDOWN).isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait a minute before asking for another email");
        }
        String token = issueToken(user);
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), verifyUrl(token));
    }

    /** Marks the matching account verified. Tokens are single-use and expire after 48 hours. */
    @Transactional
    public User verify(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This confirmation link is invalid");
        }
        User user = userRepository.findByVerificationTokenHash(hash(token))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "This confirmation link is invalid or has already been used"));
        if (user.getVerificationSentAt() == null
                || user.getVerificationSentAt().plus(TOKEN_TTL).isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "This confirmation link has expired. Request a new one from the app.");
        }
        user.setEmailVerified(true);
        user.setVerificationTokenHash(null);
        return userRepository.save(user);
    }

    private String issueToken(User user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        user.setVerificationTokenHash(hash(token));
        user.setVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);
        return token;
    }

    private String verifyUrl(String token) {
        return emailService.appUrl("/verify-email?token=" + token);
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
