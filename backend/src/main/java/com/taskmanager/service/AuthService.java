package com.taskmanager.service;

import com.taskmanager.config.JwtTokenProvider;
import com.taskmanager.dto.AuthResponse;
import com.taskmanager.dto.LoginRequest;
import com.taskmanager.dto.RegisterRequest;
import com.taskmanager.dto.UserDTO;
import com.taskmanager.model.User;
import com.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationService emailVerificationService;
    private final LoginAttemptService loginAttempts;

    @Autowired
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            AuthenticationManager authenticationManager,
            EmailVerificationService emailVerificationService,
            LoginAttemptService loginAttempts) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.emailVerificationService = emailVerificationService;
        this.loginAttempts = loginAttempts;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists. Try logging in.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setEmailVerified(false);
        user = userRepository.save(user);

        // Welcome email with a "confirm your email" link (sent in the background)
        emailVerificationService.startVerification(user);

        return new AuthResponse(issueToken(user), convertToDTO(user));
    }

    public AuthResponse login(LoginRequest request) {
        String typed = request.getEmail().trim();
        // Accounts may have been created with different capitalisation; log in with the stored form
        String email = userRepository.findByEmailIgnoreCase(typed).map(User::getEmail).orElse(typed);

        long locked = loginAttempts.secondsLocked(email);
        if (locked > 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Too many failed attempts. Try again in " + Math.max(1, (locked + 59) / 60) + " minutes.");
        }
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (AuthenticationException e) {
            loginAttempts.recordFailure(email);
            // Same message whether the email exists or not, so accounts can't be discovered
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password");
        }
        loginAttempts.recordSuccess(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));
        return new AuthResponse(issueToken(user), convertToDTO(user));
    }

    public String issueToken(User user) {
        return jwtTokenProvider.generateToken(user.getEmail(), user.currentTokenVersion());
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setEmailNotifications(user.getEmailNotifications());
        // Accounts created before verification existed (null) count as verified
        dto.setEmailVerified(!Boolean.FALSE.equals(user.getEmailVerified()));
        return dto;
    }
}
