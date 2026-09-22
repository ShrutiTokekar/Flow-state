package com.taskmanager.service;

import com.taskmanager.model.Task;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.service.EmailService.TaskEmailKind;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Automatic deadline alerts, in the app and by email (unless the user turned email off):
 * "due soon" once in the 24 hours before a task is due, and "overdue" once after it passes.
 * Each alert is keyed by task and due date, so it's sent once, and again only if the due date changes.
 */
@Service
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    public NotificationScheduler(TaskRepository taskRepository, NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 15 * 60 * 1000, initialDelay = 60 * 1000)
    @Transactional
    public void checkUpcomingDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        // Wide enough to catch date-only tasks (stored at midnight) due today or tomorrow,
        // and tasks that went overdue in the last day.
        List<Task> candidates = taskRepository.findByDueDateBetweenAndStatusNot(now.minusDays(2), now.plusDays(2), "DONE");

        int sent = 0;
        for (Task task : candidates) {
            LocalDateTime deadline = effectiveDeadline(task.getDueDate());
            String keySuffix = task.getId() + ":" + task.getDueDate();

            if (deadline.isAfter(now) && !deadline.isAfter(now.plusHours(24))) {
                if (notificationService.taskAlert(task.getUser(), task, TaskEmailKind.DUE_SOON,
                        "due-soon:" + keySuffix, true, false)) sent++;
            } else if (!deadline.isAfter(now) && deadline.isAfter(now.minusHours(24))) {
                // Only tasks that became overdue in the last day, so a deploy doesn't email
                // people about every old overdue task at once.
                if (notificationService.taskAlert(task.getUser(), task, TaskEmailKind.OVERDUE,
                        "overdue:" + keySuffix, true, false)) sent++;
            }
        }
        if (sent > 0) log.info("Sent {} deadline alerts", sent);
    }

    /** Date-only tasks are stored at midnight but are due by the end of that day. */
    static LocalDateTime effectiveDeadline(LocalDateTime due) {
        return due.toLocalTime().equals(LocalTime.MIDNIGHT) ? due.plusDays(1) : due;
    }
}
