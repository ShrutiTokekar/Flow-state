package com.taskmanager.controller;

import com.taskmanager.dto.UserDTO;
import com.taskmanager.service.AuthService;
import com.taskmanager.service.EmailVerificationService;
import com.taskmanager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    private final EmailVerificationService emailVerificationService;
    private final AuthService authService;
    
    @Autowired
    public UserController(UserService userService, EmailVerificationService emailVerificationService,
                          AuthService authService) {
        this.userService = userService;
        this.emailVerificationService = emailVerificationService;
        this.authService = authService;
    }

    @PostMapping("/me/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@AuthenticationPrincipal UserDetails userDetails) {
        emailVerificationService.resend(userService.findByEmail(userDetails.getUsername()));
        return ResponseEntity.ok(Map.of("message", "Confirmation email sent"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.convertToDTO(userService.findByEmail(userDetails.getUsername())));
    }
    
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserDTO userDTO
    ) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(userService.updateProfile(userId, userDTO));
    }
    
    /**
     * Body: {"currentPassword": "...", "newPassword": "..."}. Signs out other devices and
     * returns a fresh token for this one.
     */
    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> passwordData
    ) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        var user = userService.changePassword(userId, passwordData.get("currentPassword"), passwordData.get("newPassword"));
        return ResponseEntity.ok(Map.of("token", authService.issueToken(user)));
    }

    /** "Log out of all devices": every existing token stops working, including this one. */
    @PostMapping("/me/logout-all")
    public ResponseEntity<Void> logoutEverywhere(@AuthenticationPrincipal UserDetails userDetails) {
        userService.signOutEverywhere(userService.findByEmail(userDetails.getUsername()).getId());
        return ResponseEntity.noContent().build();
    }
}