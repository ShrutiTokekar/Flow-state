package com.taskmanager.controller;

import com.taskmanager.model.Notification;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.service.NotificationService;

import jakarta.validation.Valid;

import com.taskmanager.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/reminders")
@CrossOrigin(origins = "${cors.allowed.origins}")
public class ReminderController {

    private final NotificationService notificationService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ReminderController(NotificationService notificationService,
                               TaskRepository taskRepository,
                               UserRepository userRepository,
                               EmailService emailService) {
        this.notificationService = notificationService;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Called by frontend after task creation to register a reminder.
     * Body: { taskId, minutesBefore, reminderType }
     * reminderType: "IN_APP" | "EMAIL" | "BOTH"
     */
    @PostMapping
    public ResponseEntity<?> createReminder(@Valid @RequestBody Map<String, Object> body,
                                             Authentication authentication) {
        try {
            User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

            Long taskId = Long.valueOf(body.get("taskId").toString());
            int minutesBefore = Integer.parseInt(body.get("minutesBefore").toString());
            String reminderType = body.getOrDefault("reminderType", "BOTH").toString();

            Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

            // Create an immediate in-app notification confirming the reminder was set
            String confirmMsg = "🔔 Reminder set for \"" + task.getTitle() + "\" — "
                + minutesBefore + " minute" + (minutesBefore == 1 ? "" : "s") + " before deadline.";
            notificationService.createNotification(user, confirmMsg, Notification.NotificationType.INFO, task);

            // If task has a due date, schedule reminder time
            if (task.getDueDate() != null) {
                LocalDateTime reminderTime = task.getDueDate().minusMinutes(minutesBefore);
                LocalDateTime now = LocalDateTime.now();

                // If reminder time is still in the future, store as a scheduled notification
                // (NotificationScheduler will pick it up based on dueDate)
                // If reminder time has already passed or is within 5 min, fire immediately
                if (reminderTime.isBefore(now.plusMinutes(5))) {
                    String msg = "⏰ Reminder: \"" + task.getTitle() + "\" is due very soon!";
                    notificationService.createNotification(user, msg, Notification.NotificationType.REMINDER, task);

                    if ("EMAIL".equals(reminderType) || "BOTH".equals(reminderType)) {
                        emailService.sendTaskDueReminderNotification(user, task);
                    }
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Reminder registered"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}