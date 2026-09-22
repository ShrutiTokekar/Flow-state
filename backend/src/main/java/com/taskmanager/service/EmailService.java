package com.taskmanager.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends transactional email through Resend's HTTP API.
 *
 * All emails are built here as branded HTML, so nothing depends on templates
 * configured in the Resend dashboard. Methods take plain values (not JPA entities)
 * because they run on a background thread via @Async.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String PURPLE = "#8894d1";
    private static final String GREEN = "#cae892";
    private static final String YELLOW = "#fdfac5";

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${mail.from:notifications@flowstatemanage.com}")
    private String fromAddress;

    @Value("${frontend.url:https://flowstatemanage.com}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /** Absolute link into the web app, e.g. appUrl("/calendar"). */
    public String appUrl(String path) {
        String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        return base + path;
    }

    // ── Account ───────────────────────────────────────────────────────────────

    @Async
    public void sendWelcomeEmail(String to, String name, String verifyUrl) {
        String body = verifyUrl != null
            ? p("Thanks for joining Flow State. Please confirm this is your email address so we can send you reminders and calendar invites.")
              + button("Confirm my email", verifyUrl)
              + small("This link expires in 48 hours. If you didn't create an account, you can ignore this email.")
            : p("Thanks for joining Flow State. You're all set.");
        body += h2("Here's what you can do")
            + list("Add tasks and move them from To do to Done",
                   "Share a calendar with roommates, classmates or your team",
                   "Find your free time, or when everyone in a group is free",
                   "Get reminders by email and in the app before things are due");
        if (verifyUrl == null) body += button("Open Flow State", appUrl("/dashboard"));
        send(to, verifyUrl != null ? "Confirm your email for Flow State" : "Welcome to Flow State, " + name + "!",
            layout("Welcome, " + esc(name) + "!", body));
    }

    @Async
    public void sendVerificationEmail(String to, String name, String verifyUrl) {
        send(to, "Confirm your email for Flow State", layout("Confirm your email",
            p("Hi " + esc(name) + ", tap the button below to confirm your email address.")
            + button("Confirm my email", verifyUrl)
            + small("This link expires in 48 hours. If you didn't ask for this, you can ignore this email.")));
    }

    // ── Tasks ─────────────────────────────────────────────────────────────────

    public enum TaskEmailKind { REMINDER, DUE_SOON, OVERDUE }

    @Async
    public void sendTaskEmail(String to, String name, TaskEmailKind kind, String taskTitle,
                              String dueText, String description) {
        String subject, heading, intro;
        switch (kind) {
            case OVERDUE -> {
                subject = "Overdue: " + taskTitle;
                heading = "A task is overdue";
                intro = "Hi " + esc(name) + ", this task was due " + esc(dueText) + " and isn't done yet.";
            }
            case DUE_SOON -> {
                subject = "Due soon: " + taskTitle;
                heading = "Due soon";
                intro = "Hi " + esc(name) + ", this task is due " + esc(dueText) + ".";
            }
            default -> {
                subject = "Reminder: " + taskTitle;
                heading = "Reminder";
                intro = "Hi " + esc(name) + ", here's the reminder you set. This task is due " + esc(dueText) + ".";
            }
        }
        String card = "<div style='border:1px solid #e5e7eb;border-left:4px solid " + PURPLE
            + ";border-radius:12px;padding:14px 16px;margin:16px 0;background:#fff'>"
            + "<div style='font-weight:600;font-size:16px;color:#111827'>" + esc(taskTitle) + "</div>"
            + (description != null && !description.isBlank()
                ? "<div style='color:#6b7280;font-size:14px;margin-top:4px'>" + esc(description) + "</div>" : "")
            + "<div style='color:#4b5563;font-size:13px;margin-top:8px'>Due " + esc(dueText) + "</div></div>";
        send(to, subject, layout(heading, p(intro) + card + button("Open my tasks", appUrl("/dashboard"))
            + small("You can turn off email notifications in Profile settings.")));
    }

    // ── Shared calendars ──────────────────────────────────────────────────────

    @Async
    public void sendCalendarInvite(String to, String inviterName, String calendarName, String joinUrl, boolean hasAccount) {
        send(to, inviterName + " shared the calendar \"" + calendarName + "\" with you",
            layout("You're invited!",
                p("<strong>" + esc(inviterName) + "</strong> invited you to join the shared calendar <strong>"
                  + esc(calendarName) + "</strong> on Flow State.")
                + p("Members can add events and shared to-dos, check things off, and see when everyone is free.")
                + button("Join " + calendarName, joinUrl)
                + small(hasAccount
                    ? "Log in with this email address to join."
                    : "You'll create a free Flow State account first. It only takes a minute.")));
    }

    @Async
    public void sendInvitesSentConfirmation(String to, String inviterName, String calendarName,
                                            List<String> invitedEmails, String calendarUrl) {
        send(to, "Invites sent for \"" + calendarName + "\"",
            layout("Invites sent",
                p("Hi " + esc(inviterName) + ", we emailed an invite to join <strong>" + esc(calendarName) + "</strong> to:")
                + list(invitedEmails.toArray(new String[0]))
                + p("We'll let you know when they join.")
                + button("Open " + calendarName, calendarUrl)));
    }

    @Async
    public void sendMemberJoined(String to, String ownerName, String memberName, String calendarName, String calendarUrl) {
        send(to, memberName + " joined \"" + calendarName + "\"",
            layout("New member",
                p("Hi " + esc(ownerName) + ", <strong>" + esc(memberName) + "</strong> just joined your shared calendar <strong>"
                  + esc(calendarName) + "</strong>.")
                + button("Open " + calendarName, calendarUrl)));
    }

    // ── Sending ───────────────────────────────────────────────────────────────

    private void send(String to, String subject, String html) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            // Local development: no key configured. Log enough to follow the flow.
            log.info("[email not sent: RESEND_API_KEY unset] to={} subject=\"{}\" links={}", to, subject, extractLinks(html));
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", "Flow State <" + fromAddress + ">");
            body.put("to", List.of(to));
            body.put("subject", subject);
            body.put("html", html);

            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.resend.com/emails", new HttpEntity<>(body, headers), String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent → {} | {}", to, subject);
            } else {
                log.error("Resend error {} sending to {}: {}", response.getStatusCode(), to, response.getBody());
            }
        } catch (Exception e) {
            // Most common cause: the "from" domain isn't verified in Resend.
            log.error("Failed to send email to {} (\"{}\"): {}", to, subject, e.getMessage());
        }
    }

    private static String extractLinks(String html) {
        List<String> links = new java.util.ArrayList<>();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("href='([^']+)'").matcher(html);
        while (m.find()) links.add(m.group(1));
        return links.toString();
    }

    // ── HTML helpers ──────────────────────────────────────────────────────────

    /** Escape user-provided text (names, titles) so it can't inject HTML into emails. */
    static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private String layout(String heading, String bodyHtml) {
        return "<!doctype html><html><body style='margin:0;padding:0;background:" + YELLOW + "'>"
            + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:" + YELLOW + ";padding:24px 12px'>"
            + "<tr><td align='center'>"
            + "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937'>"
            + "<tr><td style='background:" + PURPLE + ";padding:18px 24px'>"
            + "<a href='" + appUrl("/") + "' style='color:" + GREEN + ";font-size:24px;font-weight:700;text-decoration:none'>Flow State</a>"
            + "</td></tr>"
            + "<tr><td style='padding:28px 24px'>"
            + "<h1 style='margin:0 0 12px;font-size:22px;color:#111827'>" + heading + "</h1>"
            + bodyHtml
            + "</td></tr>"
            + "<tr><td style='padding:16px 24px;background:#f9fafb;color:#9ca3af;font-size:12px'>"
            + "You're receiving this because you have a Flow State account or were invited to one."
            + "</td></tr></table></td></tr></table></body></html>";
    }

    private static String p(String html) {
        return "<p style='margin:0 0 14px;font-size:15px;line-height:1.6'>" + html + "</p>";
    }

    private static String h2(String text) {
        return "<h2 style='margin:22px 0 8px;font-size:16px;color:#111827'>" + esc(text) + "</h2>";
    }

    private static String small(String text) {
        return "<p style='margin:14px 0 0;font-size:12px;color:#6b7280;line-height:1.5'>" + esc(text) + "</p>";
    }

    private static String list(String... items) {
        StringBuilder sb = new StringBuilder("<ul style='margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.7'>");
        for (String item : items) sb.append("<li>").append(esc(item)).append("</li>");
        return sb.append("</ul>").toString();
    }

    private static String button(String label, String url) {
        return "<p style='margin:20px 0'><a href='" + esc(url) + "' style='display:inline-block;background:" + PURPLE
            + ";color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px'>"
            + esc(label) + "</a></p>";
    }
}
