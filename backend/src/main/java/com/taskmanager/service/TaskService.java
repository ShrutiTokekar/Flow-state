package com.taskmanager.service;

import com.taskmanager.dto.TaskDTO;
import com.taskmanager.model.Category;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.CategoryRepository;
import com.taskmanager.repository.NotificationRepository;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationRepository notificationRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository,
                       UserRepository userRepository,
                       CategoryRepository categoryRepository,
                       NotificationRepository notificationRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.notificationRepository = notificationRepository;
    }

    private LocalDateTime parseDueDate(String dueDateStr) {
        if (dueDateStr == null || dueDateStr.isEmpty()) return null;
        if (dueDateStr.contains("T")) {
            return LocalDateTime.parse(dueDateStr);
        } else {
            return LocalDate.parse(dueDateStr).atStartOfDay();
        }
    }

    public List<TaskDTO> getAllTasksByUser(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return taskRepository.findByUserOrderByCreatedAtDesc(user).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByStatus(String email, String status) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return taskRepository.findByUserAndStatusOrderByCreatedAtDesc(user, status).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public TaskDTO getTaskById(String email, Long id) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");
        return convertToDTO(task);
    }

    public TaskDTO createTask(String email, TaskDTO taskDTO) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = new Task();
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(taskDTO.getStatus() != null ? taskDTO.getStatus() : "TODO");
        task.setPriority(taskDTO.getPriority() != null ? taskDTO.getPriority() : "MEDIUM");
        task.setDueDate(parseDueDate(taskDTO.getDueDate()));
        task.setUser(user);

        if (taskDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(taskDTO.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
            task.setCategory(category);
        }

        return convertToDTO(taskRepository.save(task));
    }

    public TaskDTO updateTask(String email, Long id, TaskDTO taskDTO) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");

        if (taskDTO.getTitle() != null) task.setTitle(taskDTO.getTitle());
        if (taskDTO.getDescription() != null) task.setDescription(taskDTO.getDescription());
        if (taskDTO.getStatus() != null) task.setStatus(taskDTO.getStatus());
        if (taskDTO.getPriority() != null) task.setPriority(taskDTO.getPriority());

        task.setDueDate(parseDueDate(taskDTO.getDueDate()));

        if (taskDTO.getCategoryId() != null) {
            Category category = categoryRepository.findById(taskDTO.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
            task.setCategory(category);
        } else {
            task.setCategory(null);
        }

        if ("DONE".equals(taskDTO.getStatus()) && task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (!"DONE".equals(taskDTO.getStatus())) {
            task.setCompletedAt(null);
        }

        return convertToDTO(taskRepository.save(task));
    }

    public void deleteTask(String email, Long id) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");

        // Delete linked notifications first to avoid FK constraint violation
        notificationRepository.deleteByTask(task);

        taskRepository.delete(task);
    }

    public TaskDTO updateTaskStatus(String email, Long id, String status) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getUser().getId().equals(user.getId())) throw new RuntimeException("Unauthorized");

        task.setStatus(status);
        if ("DONE".equals(status) && task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (!"DONE".equals(status)) {
            task.setCompletedAt(null);
        }

        return convertToDTO(taskRepository.save(task));
    }

    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());

        if (task.getDueDate() != null) {
            dto.setDueDate(task.getDueDate().toString());
        }

        dto.setCompletedAt(task.getCompletedAt());

        if (task.getCategory() != null) {
            dto.setCategoryId(task.getCategory().getId());
            dto.setCategoryName(task.getCategory().getName());
            dto.setCategoryColor(task.getCategory().getColor());
            dto.setCategoryIcon(task.getCategory().getIcon());
        }

        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());

        return dto;
    }
}