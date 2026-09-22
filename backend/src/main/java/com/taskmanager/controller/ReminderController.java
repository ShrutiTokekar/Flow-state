package com.taskmanager.controller;

import com.taskmanager.model.Reminder;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.service.ReminderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService reminderService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public ReminderController(ReminderService reminderService, TaskRepository taskRepository,
                              UserRepository userRepository) {
        this.reminderService = reminderService;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    /**
     * Set (or replace) a task's reminder.
     * Body: { taskId, minutesBefore, reminderType: "IN_APP" | "EMAIL" | "BOTH" }
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createReminder(@RequestBody Map<String, Object> body,
                                                              Authentication authentication) {
        User user = me(authentication);
        Task task = ownTask(user, parseLong(body.get("taskId"), "taskId"));
        int minutesBefore = (int) parseLong(body.get("minutesBefore"), "minutesBefore");
        Reminder.ReminderType type;
        try {
            type = Reminder.ReminderType.valueOf(String.valueOf(body.getOrDefault("reminderType", "BOTH")));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reminderType must be IN_APP, EMAIL or BOTH");
        }

        Reminder r = reminderService.setReminder(task, user, minutesBefore, type);
        return ResponseEntity.ok(toMap(r));
    }

    @GetMapping("/task/{taskId}")
    public List<Map<String, Object>> forTask(@PathVariable Long taskId, Authentication authentication) {
        return reminderService.getRemindersForTask(ownTask(me(authentication), taskId)).stream()
            .map(this::toMap).toList();
    }

    private Map<String, Object> toMap(Reminder r) {
        return Map.of(
            "id", r.getId(),
            "taskId", r.getTask().getId(),
            "minutesBefore", r.getMinutesBefore() != null ? r.getMinutesBefore() : 0,
            "reminderTime", r.getReminderTime().toString(),
            "reminderType", r.getReminderType().name(),
            "sent", Boolean.TRUE.equals(r.getIsSent()));
    }

    private User me(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private Task ownTask(User user, long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        if (!task.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
        }
        return task;
    }

    private static long parseLong(Object value, String field) {
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be a number");
        }
    }
}
