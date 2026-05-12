package com.taskmanager.service;

import com.taskmanager.model.Notification;
import com.taskmanager.model.Reminder;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.ReminderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderService {
    
    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);
    
    private final ReminderRepository reminderRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    public ReminderService(ReminderRepository reminderRepository,
                          NotificationService notificationService,
                          EmailService emailService) {
        this.reminderRepository = reminderRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }
    
    /**
     * Create a reminder for a task
     */
    @Transactional
    public Reminder createReminder(Task task, User user, int minutesBefore, Reminder.ReminderType type) {
        if (task.getDueDate() == null) {
            throw new RuntimeException("Cannot create reminder for task without due date");
        }
        
        LocalDateTime reminderTime = task.getDueDate().minusMinutes(minutesBefore);
        
        Reminder reminder = new Reminder();
        reminder.setTask(task);
        reminder.setUser(user);
        reminder.setReminderTime(reminderTime);
        reminder.setReminderType(type);
        reminder.setIsSent(false);
        
        return reminderRepository.save(reminder);
    }
    
    /**
     * Get all reminders for a task
     */
    public List<Reminder> getRemindersForTask(Task task) {
        return reminderRepository.findByTaskOrderByReminderTimeAsc(task);
    }
    
    /**
     * Get all pending reminders for a user
     */
    public List<Reminder> getPendingRemindersForUser(User user) {
        return reminderRepository.findByUserAndIsSentFalseOrderByReminderTimeAsc(user);
    }
    
    /**
     * Delete reminder
     */
    @Transactional
    public void deleteReminder(Long reminderId) {
        reminderRepository.deleteById(reminderId);
    }
    
    /**
     * Delete all reminders for a task
     */
    @Transactional
    public void deleteRemindersForTask(Long taskId) {
        reminderRepository.deleteByTaskId(taskId);
    }
    
    /**
     * Scheduled job to check and send reminders every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void checkAndSendReminders() {
        log.info("Checking for pending reminders...");
        
        List<Reminder> pendingReminders = reminderRepository.findPendingReminders(LocalDateTime.now());
        
        for (Reminder reminder : pendingReminders) {
            try {
                sendReminder(reminder);
                reminder.setIsSent(true);
                reminderRepository.save(reminder);
                log.info("Sent reminder {} for task: {}", reminder.getId(), reminder.getTask().getTitle());
            } catch (Exception e) {
                log.error("Failed to send reminder {}: {}", reminder.getId(), e.getMessage(), e);
            }
        }
        
        log.info("Processed {} reminders", pendingReminders.size());
    }
    
    /**
     * Send a reminder based on its type
     */
    private void sendReminder(Reminder reminder) {
        Task task = reminder.getTask();
        User user = reminder.getUser();
        
        String message = String.format("Reminder: '%s' is due soon!", task.getTitle());
        
        switch (reminder.getReminderType()) {
            case EMAIL:
                sendEmailReminder(user, task);
                break;
            case PUSH:
                sendPushNotification(user, task);
                break;
            case IN_APP:
                notificationService.createNotification(
                    user,
                    message,
                    Notification.NotificationType.REMINDER,
                    task
                );
                break;
        }
    }
    
    /**
     * Send email reminder
     */
    private void sendEmailReminder(User user, Task task) {
        String subject = "Task Reminder: " + task.getTitle();
        String body = String.format(
            "Hello %s,\n\n" +
            "This is a reminder that your task '%s' is due on %s.\n\n" +
            "Description: %s\n\n" +
            "Priority: %s\n\n" +
            "Don't forget to complete it!\n\n" +
            "Best regards,\n" +
            "Flow State Team",
            user.getName(),
            task.getTitle(),
            task.getDueDate(),
            task.getDescription() != null ? task.getDescription() : "N/A",
            task.getPriority()
        );
        
        try {
            emailService.sendSimpleEmail(user.getEmail(), subject, body);
            log.info("Email reminder sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send email reminder: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Send push notification (placeholder for future implementation)
     */
    private void sendPushNotification(User user, Task task) {
        // TODO: Implement push notification using Firebase Cloud Messaging or similar
        log.info("Push notification would be sent to user: {} for task: {}", user.getId(), task.getTitle());
        
        // For now, create in-app notification
        String message = String.format("Reminder: '%s' is due soon!", task.getTitle());
        notificationService.createNotification(
            user,
            message,
            Notification.NotificationType.REMINDER,
            task
        );
    }
}