package com.taskmanager.service;

import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' h:mm a");

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${mail.from:notifications@flowstatemanage.com}")
    private String fromAddress;

    @Value("${resend.template.welcome:}")
    private String welcomeTemplateId;

    @Value("${resend.template.notification:}")
    private String notificationTemplateId;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Welcome email on first sign-up ────────────────────────────────────────

    @Async
    public void sendWelcomeEmail(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", user.getName());

        sendWithTemplate(user.getEmail(), welcomeTemplateId, variables,
            // fallback subject if template not configured
            "🌿 Welcome to Flow State, " + user.getName() + "!");
    }

    // ── Task reminder emails ───────────────────────────────────────────────────

    @Async
    public void sendTaskDueReminderNotification(User user, Task task) {
        long hoursLeft = task.getDueDate() != null
            ? java.time.Duration.between(java.time.LocalDateTime.now(), task.getDueDate()).toHours()
            : 0;
        String timeStr = hoursLeft <= 1 ? "less than an hour" : hoursLeft + " hours";

        Map<String, Object> variables = buildTaskVariables(user, task,
            "⏰ Task Due Soon",
            "your task is due in " + timeStr + " — don't forget to complete it!");

        sendWithTemplate(user.getEmail(), notificationTemplateId, variables,
            "⏰ Reminder: \"" + task.getTitle() + "\" is due soon!");
    }

    @Async
    public void sendOverdueNotification(User user, Task task) {
        Map<String, Object> variables = buildTaskVariables(user, task,
            "⚠️ Task Overdue",
            "this task is overdue. Please complete it as soon as possible.");

        sendWithTemplate(user.getEmail(), notificationTemplateId, variables,
            "⚠️ Overdue: \"" + task.getTitle() + "\" needs your attention");
    }

    @Async
    public void sendTaskCreatedNotification(User user, Task task) {
        Map<String, Object> variables = buildTaskVariables(user, task,
            "✅ Task Added",
            "a new task has been added to your Flow State board.");

        sendWithTemplate(user.getEmail(), notificationTemplateId, variables,
            "✅ Task Created: " + task.getTitle());
    }

    public void sendSimpleEmail(String to, String subject, String text) {
        String html = "<div style='font-family:sans-serif;color:#333;line-height:1.6;'>"
            + text.replace("\n", "<br>") + "</div>";
        sendRawHtml(to, subject, html);
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private Map<String, Object> buildTaskVariables(User user, Task task,
                                                    String notificationTitle,
                                                    String notificationMessage) {
        String[] priorityStyle = getPriorityLabel(task.getPriority());
        String dueDate = task.getDueDate() != null ? task.getDueDate().format(DATE_FMT) : "No due date";
        String status = task.getStatus() != null ? task.getStatus().replace("_", " ") : "TODO";

        Map<String, Object> vars = new HashMap<>();
        vars.put("name", user.getName());
        vars.put("notification_title", notificationTitle);
        vars.put("notification_message", notificationMessage);
        vars.put("task_title", task.getTitle());
        vars.put("task_description", task.getDescription() != null ? task.getDescription() : "");
        vars.put("due_date", dueDate);
        vars.put("priority", priorityStyle[0]);
        vars.put("status", status);
        return vars;
    }

    private void sendWithTemplate(String to, String templateId, Map<String, Object> variables, String fallbackSubject) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set — skipping email to {}", to);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", "Flow State <" + fromAddress + ">");
            body.put("to", List.of(to));

            if (templateId != null && !templateId.isBlank()) {
                // Use Resend template
                body.put("template_id", templateId);
                body.put("variables", variables);
            } else {
                // No template configured — log a warning
                log.warn("No Resend template ID configured, skipping email to {}. Set RESEND_WELCOME_TEMPLATE_ID / RESEND_NOTIFICATION_TEMPLATE_ID in Render.", to);
                return;
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.resend.com/emails", request, String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent via template → {} | {}", to, fallbackSubject);
            } else {
                log.error("Resend error {}: {}", response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private void sendRawHtml(String to, String subject, String html) {
        if (resendApiKey == null || resendApiKey.isBlank()) return;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", "Flow State <" + fromAddress + ">");
            body.put("to", List.of(to));
            body.put("subject", subject);
            body.put("html", html);

            restTemplate.postForEntity("https://api.resend.com/emails",
                new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            log.error("Failed to send raw email to {}: {}", to, e.getMessage());
        }
    }

    private String[] getPriorityLabel(String priority) {
        return switch (priority != null ? priority : "MEDIUM") {
            case "URGENT" -> new String[]{"URGENT"};
            case "HIGH"   -> new String[]{"HIGH"};
            case "LOW"    -> new String[]{"LOW"};
            default       -> new String[]{"MEDIUM"};
        };
    }
}