package com.taskmanager.service;

import com.taskmanager.dto.CategoryDTO;
import com.taskmanager.model.Category;
import com.taskmanager.model.User;
import com.taskmanager.repository.CategoryRepository;
import com.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }
    
    public List<CategoryDTO> getAllCategoriesForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Category> categories = categoryRepository.findByUserOrderByCreatedAtAsc(user);
        return categories.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    
    @Transactional
    public CategoryDTO createCategory(Long userId, CategoryDTO categoryDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Category category = new Category();
        category.setName(categoryDTO.getName());
        category.setColor(categoryDTO.getColor() != null ? categoryDTO.getColor() : "#3B82F6");
        category.setIcon(categoryDTO.getIcon() != null ? categoryDTO.getIcon() : "folder");
        category.setUser(user);
        
        category = categoryRepository.save(category);
        return convertToDTO(category);
    }
    
    @Transactional
    public CategoryDTO updateCategory(Long userId, Long categoryId, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
        
        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to category");
        }
        
        if (categoryDTO.getName() != null) {
            category.setName(categoryDTO.getName());
        }
        if (categoryDTO.getColor() != null) {
            category.setColor(categoryDTO.getColor());
        }
        if (categoryDTO.getIcon() != null) {
            category.setIcon(categoryDTO.getIcon());
        }
        
        category = categoryRepository.save(category);
        return convertToDTO(category);
    }
    
    @Transactional
    public void deleteCategory(Long userId, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));
        
        if (!category.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to category");
        }
        
        categoryRepository.delete(category);
    }
    
    private CategoryDTO convertToDTO(Category category) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setColor(category.getColor());
        dto.setIcon(category.getIcon());
        dto.setTaskCount(category.getTasks() != null ? category.getTasks().size() : 0);
        return dto;
    }
}