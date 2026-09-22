package com.taskmanager.service;

import com.taskmanager.dto.SharedCalendarDTOs.*;
import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.CalendarMember;
import com.taskmanager.model.CalendarMember.Role;
import com.taskmanager.model.SharedCalendar;
import com.taskmanager.model.User;
import com.taskmanager.repository.CalendarEventRepository;
import com.taskmanager.repository.CalendarMemberRepository;
import com.taskmanager.repository.SharedCalendarRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
public class SharedCalendarService {

    private static final Logger log = LoggerFactory.getLogger(SharedCalendarService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String DEFAULT_COLOR = "#8894d1";

    private final SharedCalendarRepository calendarRepository;
    private final CalendarMemberRepository memberRepository;
    private final CalendarEventRepository eventRepository;

    public SharedCalendarService(SharedCalendarRepository calendarRepository,
                                 CalendarMemberRepository memberRepository,
                                 CalendarEventRepository eventRepository) {
        this.calendarRepository = calendarRepository;
        this.memberRepository = memberRepository;
        this.eventRepository = eventRepository;
    }

    // ── Calendars ──────────────────────────────────────────────────────────

    public List<CalendarSummary> listForUser(User user) {
        return memberRepository.findByUserWithCalendar(user).stream()
                .map(m -> toSummary(m.getCalendar(), m.getRole()))
                .toList();
    }

    @Transactional
    public CalendarDetail create(User user, String name, String color) {
        SharedCalendar calendar = new SharedCalendar();
        calendar.setName(name.trim());
        calendar.setColor(color != null ? color : DEFAULT_COLOR);
        calendar.setOwner(user);
        calendar.setShareToken(newToken());
        calendarRepository.save(calendar);
        memberRepository.save(new CalendarMember(calendar, user, Role.OWNER));
        log.info("Created shared calendar {} for user {}", calendar.getId(), user.getId());
        return getDetail(user, calendar.getId());
    }

    public CalendarDetail getDetail(User user, Long calendarId) {
        CalendarMember me = requireMember(user, calendarId);
        SharedCalendar calendar = me.getCalendar();
        List<Member> members = memberRepository.findByCalendarWithUser(calendar).stream()
                .map(m -> new Member(m.getUser().getId(), m.getUser().getName(), m.getUser().getEmail(),
                        m.getRole(), m.getJoinedAt()))
                .toList();
        String token = me.getRole() == Role.OWNER ? calendar.getShareToken() : null;
        return new CalendarDetail(calendar.getId(), calendar.getName(), calendar.getColor(), me.getRole(),
                calendar.getOwner().getName(), token, members);
    }

    @Transactional
    public CalendarDetail update(User user, Long calendarId, String name, String color) {
        SharedCalendar calendar = requireOwner(user, calendarId).getCalendar();
        if (name != null) calendar.setName(name.trim());
        if (color != null) calendar.setColor(color);
        calendarRepository.save(calendar);
        return getDetail(user, calendarId);
    }

    @Transactional
    public void delete(User user, Long calendarId) {
        SharedCalendar calendar = requireOwner(user, calendarId).getCalendar();
        eventRepository.deleteByCalendar(calendar);
        memberRepository.deleteByCalendar(calendar);
        calendarRepository.delete(calendar);
        log.info("Deleted shared calendar {}", calendarId);
    }

    // ── Sharing ────────────────────────────────────────────────────────────

    /** Invalidates the old invite link. */
    @Transactional
    public CalendarDetail regenerateLink(User user, Long calendarId) {
        SharedCalendar calendar = requireOwner(user, calendarId).getCalendar();
        calendar.setShareToken(newToken());
        calendarRepository.save(calendar);
        return getDetail(user, calendarId);
    }

    public InvitePreview previewInvite(String token) {
        SharedCalendar calendar = findByToken(token);
        return new InvitePreview(calendar.getName(), calendar.getColor(),
                calendar.getOwner().getName(), memberRepository.countByCalendar(calendar));
    }

    /** Anyone with a valid link joins as an editor. Joining twice is a no-op. */
    @Transactional
    public CalendarSummary join(User user, String token) {
        SharedCalendar calendar = findByToken(token);
        CalendarMember member = memberRepository.findByCalendarAndUser(calendar, user)
                .orElseGet(() -> memberRepository.save(new CalendarMember(calendar, user, Role.EDITOR)));
        return toSummary(calendar, member.getRole());
    }

    @Transactional
    public void changeRole(User user, Long calendarId, Long memberUserId, Role role) {
        SharedCalendar calendar = requireOwner(user, calendarId).getCalendar();
        if (role == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ownership can't be transferred");
        }
        CalendarMember target = memberRepository.findByCalendarAndUserId(calendar, memberUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        if (target.getRole() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The owner's role can't be changed");
        }
        target.setRole(role);
        memberRepository.save(target);
    }

    /** The owner can remove anyone else; any other member can remove themselves (leave). */
    @Transactional
    public void removeMember(User user, Long calendarId, Long memberUserId) {
        CalendarMember me = requireMember(user, calendarId);
        boolean leaving = user.getId().equals(memberUserId);
        if (leaving && me.getRole() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The owner can't leave. Delete the calendar instead.");
        }
        if (!leaving && me.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can remove members");
        }
        CalendarMember target = memberRepository.findByCalendarAndUserId(me.getCalendar(), memberUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        memberRepository.delete(target);
    }

    public List<User> memberUsers(User user, Long calendarId) {
        CalendarMember me = requireMember(user, calendarId);
        return memberRepository.findByCalendarWithUser(me.getCalendar()).stream()
                .map(CalendarMember::getUser)
                .toList();
    }

    // ── Events ─────────────────────────────────────────────────────────────

    public List<CalendarEvent> listEvents(User user, Long calendarId) {
        return eventRepository.findByCalendarOrderByStartTimeAsc(requireMember(user, calendarId).getCalendar());
    }

    @Transactional
    public CalendarEvent createEvent(User user, Long calendarId, CalendarEvent event) {
        CalendarMember me = requireEditor(user, calendarId);
        event.setCalendar(me.getCalendar());
        event.setUser(user);
        if (event.getType() == null) event.setType("event");
        if (event.getColor() == null) event.setColor(me.getCalendar().getColor());
        return eventRepository.save(event);
    }

    @Transactional
    public CalendarEvent updateEvent(User user, Long calendarId, Long eventId, CalendarEvent changes) {
        CalendarEvent existing = requireEventInCalendar(requireEditor(user, calendarId), eventId);
        if (changes.getTitle() != null) existing.setTitle(changes.getTitle());
        if (changes.getDescription() != null) existing.setDescription(changes.getDescription());
        if (changes.getStartTime() != null) existing.setStartTime(changes.getStartTime());
        if (changes.getEndTime() != null) existing.setEndTime(changes.getEndTime());
        if (changes.getType() != null) existing.setType(changes.getType());
        if (changes.getCompleted() != null) existing.setCompleted(changes.getCompleted());
        return eventRepository.save(existing);
    }

    @Transactional
    public void deleteEvent(User user, Long calendarId, Long eventId) {
        eventRepository.delete(requireEventInCalendar(requireEditor(user, calendarId), eventId));
    }

    // ── Access checks ──────────────────────────────────────────────────────

    private CalendarMember requireMember(User user, Long calendarId) {
        SharedCalendar calendar = calendarRepository.findById(calendarId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Calendar not found"));
        // Non-members get 404 too, so calendar IDs can't be probed.
        return memberRepository.findByCalendarAndUser(calendar, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Calendar not found"));
    }

    private CalendarMember requireEditor(User user, Long calendarId) {
        CalendarMember me = requireMember(user, calendarId);
        if (!me.canEdit()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You have view-only access to this calendar");
        }
        return me;
    }

    private CalendarMember requireOwner(User user, Long calendarId) {
        CalendarMember me = requireMember(user, calendarId);
        if (me.getRole() != Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can do that");
        }
        return me;
    }

    private CalendarEvent requireEventInCalendar(CalendarMember me, Long eventId) {
        CalendarEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (event.getCalendar() == null || !event.getCalendar().getId().equals(me.getCalendar().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return event;
    }

    private SharedCalendar findByToken(String token) {
        return calendarRepository.findByShareToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "This invite link is invalid or has been reset"));
    }

    private CalendarSummary toSummary(SharedCalendar calendar, Role role) {
        return new CalendarSummary(calendar.getId(), calendar.getName(), calendar.getColor(), role,
                calendar.getOwner().getName(), memberRepository.countByCalendar(calendar));
    }

    private static String newToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
