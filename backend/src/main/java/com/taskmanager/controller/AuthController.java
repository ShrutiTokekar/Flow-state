package com.taskmanager.controller;

import com.taskmanager.dto.AuthResponse;
import com.taskmanager.dto.LoginRequest;
import com.taskmanager.dto.RegisterRequest;
import com.taskmanager.service.AuthService;
import com.taskmanager.service.EmailVerificationService;
import com.taskmanager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final UserService userService;
    
    @Autowired
    public AuthController(AuthService authService, EmailVerificationService emailVerificationService,
                          UserService userService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
        this.userService = userService;
    }
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Public: the link in the confirmation email lands on the app, which posts the token here. */
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> body) {
        var user = emailVerificationService.verify(body.get("token"));
        return ResponseEntity.ok(userService.convertToDTO(user));
    }
}