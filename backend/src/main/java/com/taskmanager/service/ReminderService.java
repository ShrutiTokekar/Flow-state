package com.taskmanager.service;

import com.taskmanager.model.Reminder;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.ReminderRepository;
import com.taskmanager.service.EmailService.TaskEmailKind;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderService {

    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

    private final ReminderRepository reminderRepository;
    private final NotificationService notificationService;

    public ReminderService(ReminderRepository reminderRepository, NotificationService notificationService) {
        this.reminderRepository = reminderRepository;
        this.notificationService = notificationService;
    }

    /**
     * Sets the task's reminder, replacing any unsent one (the app offers one reminder per task).
     * If the reminder time has already passed, it's sent right away.
     */
    @Transactional
    public Reminder setReminder(Task task, User user, int minutesBefore, Reminder.ReminderType type) {
        if (task.getDueDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add a due date before setting a reminder");
        }
        if (minutesBefore < 0 || minutesBefore > 60 * 24 * 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reminder must be between 0 minutes and 30 days before");
        }
        reminderRepository.deleteAll(reminderRepository.findByTaskAndIsSentFalse(task));

        Reminder reminder = new Reminder();
        reminder.setTask(task);
        reminder.setUser(user);
        reminder.setMinutesBefore(minutesBefore);
        reminder.setReminderTime(task.getDueDate().minusMinutes(minutesBefore));
        reminder.setReminderType(type);
        reminder.setIsSent(false);
        reminder = reminderRepository.save(reminder);

        if (!reminder.getReminderTime().isAfter(LocalDateTime.now())) {
            send(reminder);
        }
        return reminder;
    }

    /** Keep unsent reminders in step when a task's due date changes (or clear them if it's removed). */
    @Transactional
    public void rescheduleForTask(Task task) {
        List<Reminder> pending = reminderRepository.findByTaskAndIsSentFalse(task);
        if (task.getDueDate() == null) {
            reminderRepository.deleteAll(pending);
            return;
        }
        for (Reminder r : pending) {
            int minutes = r.getMinutesBefore() != null ? r.getMinutesBefore() : 0;
            r.setReminderTime(task.getDueDate().minusMinutes(minutes));
        }
        reminderRepository.saveAll(pending);
    }

    public List<Reminder> getRemindersForTask(Task task) {
        return reminderRepository.findByTaskOrderByReminderTimeAsc(task);
    }

    @Transactional
    public void deleteRemindersForTask(Long taskId) {
        reminderRepository.deleteByTaskId(taskId);
    }

    /** Every minute: send reminders whose time has come. */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void checkAndSendReminders() {
        List<Reminder> due = reminderRepository.findPendingReminders(LocalDateTime.now());
        for (Reminder reminder : due) {
            try {
                send(reminder);
            } catch (Exception e) {
                log.error("Failed to send reminder {}: {}", reminder.getId(), e.getMessage(), e);
            }
        }
        if (!due.isEmpty()) log.info("Processed {} reminders", due.size());
    }

    private void send(Reminder reminder) {
        Task task = reminder.getTask();
        reminder.setIsSent(true);
        reminderRepository.save(reminder);
        if ("DONE".equals(task.getStatus())) return; // no point reminding about finished work

        boolean email = switch (reminder.getReminderType()) {
            case EMAIL, BOTH -> true;
            case IN_APP, PUSH -> false; // native push isn't set up yet, so PUSH shows in the app
        };
        // The user explicitly asked for this reminder by email, so send it even if general
        // email notifications are off.
        notificationService.taskAlert(reminder.getUser(), task, TaskEmailKind.REMINDER,
            "reminder:" + reminder.getId(), email, true);
        log.info("Sent reminder {} for task {}", reminder.getId(), task.getId());
    }
}
