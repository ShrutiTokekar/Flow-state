package com.taskmanager.service;

import com.taskmanager.model.Notification;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import com.taskmanager.repository.NotificationRepository;
import com.taskmanager.service.EmailService.TaskEmailKind;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional(readOnly = true) // open-in-view is off; reads (incl. lazy fields) happen here
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEE, MMM d");
    private static final DateTimeFormatter DAY_TIME = DateTimeFormatter.ofPattern("EEE, MMM d 'at' h:mm a");

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public NotificationService(NotificationRepository notificationRepository, EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
    }

    // ── Creating ──────────────────────────────────────────────────────────────

    @Transactional
    public Notification createNotification(User user, String message, Notification.NotificationType type, Task task) {
        return create(user, message, type, task, task != null ? "/dashboard" : null, null);
    }

    @Transactional
    public Notification createNotification(User user, String message, Notification.NotificationType type) {
        return create(user, message, type, null, null, null);
    }

    /** In-app notification that opens {@code link} when tapped. */
    @Transactional
    public Notification notify(User user, String message, Notification.NotificationType type, String link) {
        return create(user, message, type, null, link, null);
    }

    /**
     * In-app notification (and email, if the user allows it) about a task.
     * With a dedupKey, the alert is sent at most once; returns false if it was already sent.
     *
     * @param forceEmail send the email even if the user turned email notifications off
     *                   (used for reminders they explicitly asked to get by email)
     */
    @Transactional
    public boolean taskAlert(User user, Task task, TaskEmailKind kind, String dedupKey, boolean sendEmail, boolean forceEmail) {
        if (dedupKey != null && notificationRepository.existsByDedupKey(dedupKey)) return false;

        String due = dueText(task.getDueDate());
        String message = switch (kind) {
            case OVERDUE -> "⚠️ \"" + task.getTitle() + "\" is overdue (was due " + due + ").";
            case DUE_SOON -> "📅 \"" + task.getTitle() + "\" is due " + due + ".";
            case REMINDER -> "⏰ Reminder: \"" + task.getTitle() + "\" is due " + due + ".";
        };
        Notification.NotificationType type = kind == TaskEmailKind.REMINDER
            ? Notification.NotificationType.REMINDER : Notification.NotificationType.DEADLINE;
        create(user, message, type, task, "/dashboard", dedupKey);

        boolean emailAllowed = forceEmail || !Boolean.FALSE.equals(user.getEmailNotifications());
        if (sendEmail && emailAllowed) {
            emailService.sendTaskEmail(user.getEmail(), user.getName(), kind, task.getTitle(), due, task.getDescription());
        }
        return true;
    }

    private Notification create(User user, String message, Notification.NotificationType type,
                                Task task, String link, String dedupKey) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setType(type);
        notification.setTask(task);
        notification.setLink(link);
        notification.setDedupKey(dedupKey);
        notification.setIsRead(false);
        return notificationRepository.save(notification);
    }

    /** "Wed, Sep 23 at 9:00 AM", or just "Wed, Sep 23" for date-only tasks (stored at midnight). */
    public static String dueText(LocalDateTime due) {
        if (due == null) return "soon";
        return due.toLocalTime().equals(java.time.LocalTime.MIDNIGHT) ? due.format(DAY) : due.format(DAY_TIME);
    }

    // ── Reading & updating (always scoped to the signed-in user) ──────────────

    public List<Notification> getNotificationsForUser(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
    }

    public Long getUnreadCount(User user) {
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional
    public Notification markAsRead(User user, Long notificationId) {
        Notification notification = requireOwn(user, notificationId);
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = getUnreadNotifications(user);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
        log.info("Marked {} notifications as read for user {}", unread.size(), user.getId());
    }

    @Transactional
    public void deleteNotification(User user, Long notificationId) {
        notificationRepository.delete(requireOwn(user, notificationId));
    }

    private Notification requireOwn(User user, Long id) {
        return notificationRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
    }
}
