package com.taskmanager.controller;

import com.taskmanager.dto.SharedCalendarDTOs.*;
import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.CalendarMember;
import com.taskmanager.model.User;
import com.taskmanager.service.FreeTimeService;
import com.taskmanager.service.FreeTimeService.FreeSlot;
import com.taskmanager.service.SharedCalendarService;
import com.taskmanager.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/calendars")
public class SharedCalendarController {

    private static final String HEX_COLOR = "^#[0-9a-fA-F]{6}$";
    static final int MAX_FREE_TIME_DAYS = 31;

    public record CalendarRequest(
            @Size(min = 1, max = 60, message = "Name must be 1–60 characters") String name,
            @Pattern(regexp = HEX_COLOR, message = "Color must look like #8894d1") String color) {}

    public record RoleRequest(@NotNull CalendarMember.Role role) {}

    public record InviteRequest(@NotNull List<String> emails) {}

    public record EventRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 1000) String description,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime,
            @Pattern(regexp = "^(event|task|reminder)$") String type,
            Boolean completed) {}

    /** Partial update — every field is optional (e.g. just {"completed": true}). */
    public record EventPatch(
            @Size(min = 1, max = 255) String title,
            @Size(max = 1000) String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            @Pattern(regexp = "^(event|task|reminder)$") String type,
            Boolean completed) {}

    private final SharedCalendarService calendarService;
    private final FreeTimeService freeTimeService;
    private final UserService userService;

    public SharedCalendarController(SharedCalendarService calendarService,
                                    FreeTimeService freeTimeService,
                                    UserService userService) {
        this.calendarService = calendarService;
        this.freeTimeService = freeTimeService;
        this.userService = userService;
    }

    // ── Calendars ──────────────────────────────────────────────────────────

    @GetMapping
    public List<CalendarSummary> list(Authentication auth) {
        return calendarService.listForUser(me(auth));
    }

    @PostMapping
    public ResponseEntity<CalendarDetail> create(@Valid @RequestBody CalendarRequest body, Authentication auth) {
        if (body.name() == null || body.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(calendarService.create(me(auth), body.name(), body.color()));
    }

    @GetMapping("/{id}")
    public CalendarDetail get(@PathVariable Long id, Authentication auth) {
        return calendarService.getDetail(me(auth), id);
    }

    @PutMapping("/{id}")
    public CalendarDetail update(@PathVariable Long id, @Valid @RequestBody CalendarRequest body, Authentication auth) {
        if (body.name() != null && body.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name can't be blank");
        }
        return calendarService.update(me(auth), id, body.name(), body.color());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        calendarService.delete(me(auth), id);
        return ResponseEntity.noContent().build();
    }

    // ── Sharing & members ──────────────────────────────────────────────────

    @PostMapping("/{id}/share-link")
    public CalendarDetail regenerateLink(@PathVariable Long id, Authentication auth) {
        return calendarService.regenerateLink(me(auth), id);
    }

    /** Public: lets the invite page show what you're joining before you log in. */
    @GetMapping("/invite/{token}")
    public InvitePreview previewInvite(@PathVariable String token) {
        return calendarService.previewInvite(token);
    }

    @PostMapping("/invite/{token}/join")
    public CalendarSummary join(@PathVariable String token, Authentication auth) {
        return calendarService.join(me(auth), token);
    }

    /** Invite people by email. Body: {"emails": ["a@x.com", "b@y.com"]} */
    @PostMapping("/{id}/invites")
    public InviteResult invite(@PathVariable Long id, @Valid @RequestBody InviteRequest body, Authentication auth) {
        return calendarService.inviteByEmail(me(auth), id, body.emails());
    }

    @DeleteMapping("/{id}/invites/{inviteId}")
    public ResponseEntity<Void> cancelInvite(@PathVariable Long id, @PathVariable Long inviteId, Authentication auth) {
        calendarService.cancelInvite(me(auth), id, inviteId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> changeRole(@PathVariable Long id, @PathVariable Long userId,
                                           @Valid @RequestBody RoleRequest body, Authentication auth) {
        calendarService.changeRole(me(auth), id, userId, body.role());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId, Authentication auth) {
        calendarService.removeMember(me(auth), id, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Events ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}/events")
    public List<CalendarEvent> listEvents(@PathVariable Long id, Authentication auth) {
        return calendarService.listEvents(me(auth), id);
    }

    @PostMapping("/{id}/events")
    public ResponseEntity<CalendarEvent> createEvent(@PathVariable Long id, @Valid @RequestBody EventRequest body,
                                                     Authentication auth) {
        requireValidRange(body.startTime(), body.endTime());
        CalendarEvent event = new CalendarEvent();
        event.setTitle(body.title().trim());
        event.setDescription(body.description());
        event.setStartTime(body.startTime());
        event.setEndTime(body.endTime());
        event.setType(body.type());
        event.setCompleted(Boolean.TRUE.equals(body.completed()));
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarService.createEvent(me(auth), id, event));
    }

    @PutMapping("/{id}/events/{eventId}")
    public CalendarEvent updateEvent(@PathVariable Long id, @PathVariable Long eventId,
                                     @Valid @RequestBody EventPatch body, Authentication auth) {
        if (body.startTime() != null && body.endTime() != null) {
            requireValidRange(body.startTime(), body.endTime());
        }
        CalendarEvent changes = new CalendarEvent();
        changes.setTitle(body.title());
        changes.setDescription(body.description());
        changes.setStartTime(body.startTime());
        changes.setEndTime(body.endTime());
        changes.setType(body.type());
        changes.setCompleted(body.completed());
        return calendarService.updateEvent(me(auth), id, eventId, changes);
    }

    @DeleteMapping("/{id}/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id, @PathVariable Long eventId, Authentication auth) {
        calendarService.deleteEvent(me(auth), id, eventId);
        return ResponseEntity.noContent().build();
    }

    /** Times when every member of the calendar is free. */
    @GetMapping("/{id}/free-time")
    public List<FreeSlot> groupFreeTime(@PathVariable Long id,
                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                        @RequestParam(defaultValue = "08:00") LocalTime dayStart,
                                        @RequestParam(defaultValue = "22:00") LocalTime dayEnd,
                                        @RequestParam(defaultValue = "30") int minMinutes,
                                        Authentication auth) {
        requireValidFreeTimeQuery(from, to, minMinutes);
        List<User> members = calendarService.memberUsers(me(auth), id);
        return freeTimeService.findFreeTime(members, from, to, dayStart, dayEnd, minMinutes);
    }

    static void requireValidFreeTimeQuery(LocalDate from, LocalDate to, int minMinutes) {
        if (to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'to' must be on or after 'from'");
        }
        if (ChronoUnit.DAYS.between(from, to) >= MAX_FREE_TIME_DAYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Free time can be searched at most " + MAX_FREE_TIME_DAYS + " days at a time");
        }
        if (minMinutes < 5 || minMinutes > 24 * 60) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minMinutes must be between 5 and 1440");
        }
    }

    private static void requireValidRange(LocalDateTime start, LocalDateTime end) {
        if (end.isBefore(start)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
    }

    private User me(Authentication auth) {
        return userService.findByEmail(auth.getName());
    }
}
