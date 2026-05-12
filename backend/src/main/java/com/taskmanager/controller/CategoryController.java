package com.taskmanager.controller;

import com.taskmanager.dto.CategoryDTO;
import com.taskmanager.service.CategoryService;
import com.taskmanager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {
    
    private final CategoryService categoryService;
    private final UserService userService;
    
    @Autowired
    public CategoryController(CategoryService categoryService, UserService userService) {
        this.categoryService = categoryService;
        this.userService = userService;
    }
    
    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(categoryService.getAllCategoriesForUser(userId));
    }
    
    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CategoryDTO categoryDTO
    ) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(userId, categoryDTO));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CategoryDTO categoryDTO
    ) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        return ResponseEntity.ok(categoryService.updateCategory(userId, id, categoryDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = userService.findByEmail(userDetails.getUsername()).getId();
        categoryService.deleteCategory(userId, id);
        return ResponseEntity.noContent().build();
    }
}