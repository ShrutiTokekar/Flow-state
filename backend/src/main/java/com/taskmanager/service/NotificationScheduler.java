package com.taskmanager.service;

import com.taskmanager.model.Notification;
import com.taskmanager.model.Task;
import com.taskmanager.repository.NotificationRepository;
import com.taskmanager.repository.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    public NotificationScheduler(TaskRepository taskRepository,
                                  NotificationService notificationService,
                                  NotificationRepository notificationRepository) {
        this.taskRepository = taskRepository;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Runs every 30 minutes.
     * Creates DEADLINE notifications for tasks due within 24 hours.
     * Creates REMINDER notifications for tasks due within 1 hour.
     */
    @Scheduled(fixedRate = 30 * 60 * 1000)
    @Transactional
    public void checkUpcomingDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in24Hours = now.plusHours(24);
        LocalDateTime in1Hour = now.plusHours(1);

        // Tasks due within 24 hours (not done)
        List<Task> tasksDueSoon = taskRepository.findByDueDateBetweenAndStatusNot(now, in24Hours, "DONE");

        for (Task task : tasksDueSoon) {
            String dedupKey = "deadline-24h-" + task.getId();

            // Only create if we haven't already sent this notification today
            boolean alreadyNotified = notificationRepository
                    .findByUserOrderByCreatedAtDesc(task.getUser())
                    .stream()
                    .anyMatch(n -> n.getMessage().contains(task.getTitle())
                            && n.getType() == Notification.NotificationType.DEADLINE
                            && n.getCreatedAt().isAfter(now.minusHours(20)));

            if (!alreadyNotified) {
                long hoursLeft = java.time.Duration.between(now, task.getDueDate()).toHours();
                String message;
                
                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("h:mm a");
                DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("MMM d 'at' h:mm a");
                
                if (hoursLeft <= 1) {
                    // Show actual due time instead of relative time
                    String dueTime = task.getDueDate().format(timeFormatter);
                    message = "⏰ \"" + task.getTitle() + "\" is due at " + dueTime + "!";
                    notificationService.createNotification(task.getUser(), message, Notification.NotificationType.REMINDER, task);
                } else {
                    // Show actual due date and time
                    String dueDateTime = task.getDueDate().format(dateTimeFormatter);
                    message = "📅 \"" + task.getTitle() + "\" is due on " + dueDateTime + ".";
                    notificationService.createNotification(task.getUser(), message, Notification.NotificationType.DEADLINE, task);
                }
                log.info("Created deadline notification for task: {}", task.getTitle());
            }
        }

        // Overdue tasks (due before now, not done)
        List<Task> overdueTasks = taskRepository.findByDueDateBeforeAndStatusNot(now, "DONE");

        for (Task task : overdueTasks) {
            boolean alreadyNotified = notificationRepository
                    .findByUserOrderByCreatedAtDesc(task.getUser())
                    .stream()
                    .anyMatch(n -> n.getMessage().contains(task.getTitle())
                            && n.getMessage().contains("overdue")
                            && n.getCreatedAt().isAfter(now.minusHours(12)));

            if (!alreadyNotified) {
                String message = "⚠️ \"" + task.getTitle() + "\" is overdue! Please complete it.";
                notificationService.createNotification(task.getUser(), message, Notification.NotificationType.DEADLINE, task);
                log.info("Created overdue notification for task: {}", task.getTitle());
            }
        }
    }
}