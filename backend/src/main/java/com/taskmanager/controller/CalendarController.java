package com.taskmanager.controller;

import com.taskmanager.dto.TaskDTO;
import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.User;
import com.taskmanager.service.CalendarEventService;
import com.taskmanager.service.TaskService;
import com.taskmanager.service.UserService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    @Autowired private CalendarEventService calendarEventService;
    @Autowired private TaskService taskService;
    @Autowired private UserService userService;

    @GetMapping("/events")
    public ResponseEntity<List<CalendarEvent>> getEvents(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        return ResponseEntity.ok(calendarEventService.getEventsForUser(user));
    }

    @PostMapping("/events")
    public ResponseEntity<CalendarEvent> createEvent(@Valid@RequestBody Map<String, String> body, Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        CalendarEvent event = new CalendarEvent();
        event.setTitle(body.get("title"));
        event.setDescription(body.get("description"));
        event.setStartTime(LocalDateTime.parse(body.get("startTime")));
        event.setEndTime(LocalDateTime.parse(body.get("endTime")));
        event.setType(body.getOrDefault("type", "event"));
        return ResponseEntity.ok(calendarEventService.createEvent(user, event));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<CalendarEvent> updateEvent(@PathVariable Long id,
                                                      @Valid@RequestBody Map<String, String> body,
                                                      Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        CalendarEvent updated = new CalendarEvent();
        updated.setTitle(body.get("title"));
        updated.setDescription(body.get("description"));
        updated.setStartTime(LocalDateTime.parse(body.get("startTime")));
        updated.setEndTime(LocalDateTime.parse(body.get("endTime")));
        updated.setType(body.getOrDefault("type", "event"));
        return ResponseEntity.ok(calendarEventService.updateEvent(user, id, updated));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id, Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        calendarEventService.deleteEvent(user, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * ICS export — includes BOTH calendar events AND tasks with due dates
     */
    @GetMapping("/export/ics")
    public ResponseEntity<byte[]> exportIcs(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        List<CalendarEvent> events = calendarEventService.getEventsForUser(user);
        List<TaskDTO> tasks = taskService.getAllTasksByUser(user.getEmail());

        StringBuilder ics = new StringBuilder();
        ics.append("BEGIN:VCALENDAR\r\n");
        ics.append("VERSION:2.0\r\n");
        ics.append("PRODID:-//Flow State//FlowState Calendar//EN\r\n");
        ics.append("CALSCALE:GREGORIAN\r\n");
        ics.append("METHOD:PUBLISH\r\n");
        ics.append("X-WR-CALNAME:Flow State\r\n");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

        // Calendar events
        for (CalendarEvent e : events) {
            ics.append("BEGIN:VEVENT\r\n");
            ics.append("UID:event-").append(e.getId()).append("@flowstatemanage.com\r\n");
            ics.append("DTSTART:").append(e.getStartTime().format(fmt)).append("\r\n");
            ics.append("DTEND:").append(e.getEndTime().format(fmt)).append("\r\n");
            ics.append("SUMMARY:").append(escape(e.getTitle())).append("\r\n");
            if (e.getDescription() != null && !e.getDescription().isBlank())
                ics.append("DESCRIPTION:").append(escape(e.getDescription())).append("\r\n");
            ics.append("END:VEVENT\r\n");
        }

        // Tasks with due dates
        for (TaskDTO t : tasks) {
            if (t.getDueDate() == null || t.getDueDate().isBlank()) continue;
            // dueDate from TaskDTO is "yyyy-MM-dd" string
            LocalDateTime due;
                if (t.getDueDate().contains("T")) {
                    due = LocalDateTime.parse(t.getDueDate());
                } else {
                    due = LocalDateTime.parse(t.getDueDate() + "T00:00:00");
                }
            LocalDateTime end = due.plusHours(1);
            String statusLabel = t.getStatus() != null ? t.getStatus().replace("_", " ") : "TODO";
            ics.append("BEGIN:VEVENT\r\n");
            ics.append("UID:task-").append(t.getId()).append("@flowstatemanage.com\r\n");
            ics.append("DTSTART:").append(due.format(fmt)).append("\r\n");
            ics.append("DTEND:").append(end.format(fmt)).append("\r\n");
            ics.append("SUMMARY:\uD83D\uDCCC ").append(escape(t.getTitle())).append("\r\n");
            String desc = "[Task] Status: " + statusLabel + " | Priority: " + t.getPriority();
            if (t.getDescription() != null && !t.getDescription().isBlank())
                desc += "\\n" + t.getDescription();
            ics.append("DESCRIPTION:").append(escape(desc)).append("\r\n");
            ics.append("CATEGORIES:TASK\r\n");
            ics.append("END:VEVENT\r\n");
        }

        ics.append("END:VCALENDAR\r\n");

        byte[] bytes = ics.toString().getBytes();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/calendar"));
        headers.setContentDispositionFormData("attachment", "flowstate-calendar.ics");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n");
    }
}