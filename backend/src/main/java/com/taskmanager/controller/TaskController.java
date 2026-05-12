package com.taskmanager.controller;

import com.taskmanager.dto.TaskDTO;
import com.taskmanager.model.Notification;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.service.NotificationService;
import com.taskmanager.service.TaskService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class TaskController {

    private final TaskService taskService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Autowired
    public TaskController(TaskService taskService,
                          NotificationService notificationService,
                          UserRepository userRepository,
                          TaskRepository taskRepository) {
        this.taskService = taskService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasks(
            Authentication authentication,
            @RequestParam(required = false) String status) {
        String email = authentication.getName();
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(taskService.getTasksByStatus(email, status));
        }
        return ResponseEntity.ok(taskService.getAllTasksByUser(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(taskService.getTaskById(authentication.getName(), id));
    }

    @PostMapping
    public ResponseEntity<TaskDTO> createTask( @Valid @RequestBody TaskDTO taskDTO, Authentication authentication) {
        String email = authentication.getName();
        TaskDTO createdTask = taskService.createTask(email, taskDTO);

        // Instant in-app notification: task created
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            Task task = taskRepository.findById(createdTask.getId()).orElse(null);
            if (user != null && task != null) {
                String msg = "✅ Task created: \"" + createdTask.getTitle() + "\"";
                if (createdTask.getDueDate() != null) {
                    msg += " — due " + createdTask.getDueDate().replace("T", " at ").substring(0, Math.min(createdTask.getDueDate().length(), 16));
                }
                notificationService.createNotification(user, msg, Notification.NotificationType.INFO, task);
            }
        } catch (Exception e) {
            // Don't fail task creation if notification fails
        }

        return ResponseEntity.ok(createdTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable Long id,
                                               @Valid @RequestBody TaskDTO taskDTO,
                                               Authentication authentication) {
        String email = authentication.getName();
        TaskDTO updatedTask = taskService.updateTask(email, id, taskDTO);

        // Instant notification when task is marked DONE or moved to IN_PROGRESS
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            Task task = taskRepository.findById(id).orElse(null);
            if (user != null && task != null && taskDTO.getStatus() != null) {
                String msg = null;
                if ("DONE".equals(taskDTO.getStatus())) {
                    msg = "🎉 Task completed: \"" + updatedTask.getTitle() + "\" — great work!";
                } else if ("IN_PROGRESS".equals(taskDTO.getStatus())) {
                    msg = "▶ Task started: \"" + updatedTask.getTitle() + "\" is now in progress.";
                }
                if (msg != null) {
                    notificationService.createNotification(user, msg, Notification.NotificationType.INFO, task);
                }
            }
        } catch (Exception e) {
            // Don't fail task update if notification fails
        }

        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Authentication authentication) {
        taskService.deleteTask(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskDTO> updateTaskStatus(@PathVariable Long id,
                                                     @Valid @RequestBody Map<String, String> statusUpdate,
                                                     Authentication authentication) {
        String email = authentication.getName();
        String status = statusUpdate.get("status");
        TaskDTO updatedTask = taskService.updateTaskStatus(email, id, status);

        // Notification on status change
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            Task task = taskRepository.findById(id).orElse(null);
            if (user != null && task != null && status != null) {
                String msg = null;
                if ("DONE".equals(status)) {
                    msg = "🎉 Task completed: \"" + updatedTask.getTitle() + "\" — great work!";
                } else if ("IN_PROGRESS".equals(status)) {
                    msg = "▶ Task started: \"" + updatedTask.getTitle() + "\" is now in progress.";
                }
                if (msg != null) {
                    notificationService.createNotification(user, msg, Notification.NotificationType.INFO, task);
                }
            }
        } catch (Exception e) {
            // Don't fail status update if notification fails
        }

        return ResponseEntity.ok(updatedTask);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getTaskStats(Authentication authentication) {
        String email = authentication.getName();
        Map<String, Long> stats = new HashMap<>();
        stats.put("TODO", (long) taskService.getTasksByStatus(email, "TODO").size());
        stats.put("IN_PROGRESS", (long) taskService.getTasksByStatus(email, "IN_PROGRESS").size());
        stats.put("DONE", (long) taskService.getTasksByStatus(email, "DONE").size());
        return ResponseEntity.ok(stats);
    }
}