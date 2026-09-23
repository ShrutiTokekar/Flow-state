package com.taskmanager.service;

import com.taskmanager.dto.UserDTO;
import com.taskmanager.model.User;
import com.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true) // open-in-view is off; reads (incl. lazy fields) happen here
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
    
    @Transactional
    public UserDTO updateProfile(Long userId, UserDTO userDTO) {
        User user = findById(userId);
        
        if (userDTO.getName() != null && !userDTO.getName().isBlank()) {
            if (userDTO.getName().length() > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be 100 characters or fewer");
            }
            user.setName(userDTO.getName().trim());
        }
        if (userDTO.getAvatarUrl() != null) {
            String url = userDTO.getAvatarUrl().trim();
            if (!url.isEmpty() && (url.length() > 500 || !url.startsWith("https://"))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar must be an https:// link");
            }
            user.setAvatarUrl(url.isEmpty() ? null : url);
        }
        if (userDTO.getEmailNotifications() != null) {
            user.setEmailNotifications(userDTO.getEmailNotifications());
        }
        
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }
    
    /**
     * Changes the password. The current password is required (unless the account only signs in
     * with Google and has none yet). All other devices are signed out.
     */
    @Transactional
    public User changePassword(Long userId, String currentPassword, String newPassword) {
        User user = findById(userId);
        boolean hasPassword = user.getPassword() != null && !user.getPassword().isEmpty();
        if (hasPassword && (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your current password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be 8 to 72 characters");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.bumpTokenVersion();
        return userRepository.save(user);
    }

    /** Invalidates every login token for this account. */
    @Transactional
    public User signOutEverywhere(Long userId) {
        User user = findById(userId);
        user.bumpTokenVersion();
        return userRepository.save(user);
    }
    
    // CHANGED TO PUBLIC
    public UserDTO convertToDTO(User user) {
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