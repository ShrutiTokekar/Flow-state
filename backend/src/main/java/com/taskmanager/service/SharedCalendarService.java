package com.taskmanager.service;

import com.taskmanager.dto.SharedCalendarDTOs.*;
import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.CalendarInvite;
import com.taskmanager.model.Notification;
import com.taskmanager.model.CalendarMember;
import com.taskmanager.model.CalendarMember.Role;
import com.taskmanager.model.SharedCalendar;
import com.taskmanager.model.User;
import com.taskmanager.repository.CalendarEventRepository;
import com.taskmanager.repository.CalendarInviteRepository;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.repository.CalendarMemberRepository;
import com.taskmanager.repository.SharedCalendarRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class SharedCalendarService {

    private static final Logger log = LoggerFactory.getLogger(SharedCalendarService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String DEFAULT_COLOR = "#8894d1";
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$");
    static final int MAX_EMAILS_PER_REQUEST = 20;
    static final int MAX_PENDING_INVITES = 100;

    private final SharedCalendarRepository calendarRepository;
    private final CalendarMemberRepository memberRepository;
    private final CalendarEventRepository eventRepository;
    private final CalendarInviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public SharedCalendarService(SharedCalendarRepository calendarRepository,
                                 CalendarMemberRepository memberRepository,
                                 CalendarEventRepository eventRepository,
                                 CalendarInviteRepository inviteRepository,
                                 UserRepository userRepository,
                                 NotificationService notificationService,
                                 EmailService emailService) {
        this.calendarRepository = calendarRepository;
        this.memberRepository = memberRepository;
        this.eventRepository = eventRepository;
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
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
        boolean owner = me.getRole() == Role.OWNER;
        List<PendingInvite> pending = owner
                ? inviteRepository.findByCalendarAndAcceptedAtIsNullOrderByInvitedAtDesc(calendar).stream()
                    .map(i -> new PendingInvite(i.getId(), i.getEmail(), i.getInvitedAt())).toList()
                : List.of();
        return new CalendarDetail(calendar.getId(), calendar.getName(), calendar.getColor(), me.getRole(),
                calendar.getOwner().getName(), owner ? calendar.getShareToken() : null, members, pending);
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
        inviteRepository.deleteByCalendar(calendar);
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
        SharedCalendar calendar = resolveToken(token).calendar();
        return new InvitePreview(calendar.getName(), calendar.getColor(),
                calendar.getOwner().getName(), memberRepository.countByCalendar(calendar));
    }

    /**
     * Anyone with a valid link joins as an editor. Joining twice is a no-op.
     * Works with the calendar's share link or a personal email-invite link.
     */
    @Transactional
    public CalendarSummary join(User user, String token) {
        ResolvedToken resolved = resolveToken(token);
        SharedCalendar calendar = resolved.calendar();
        var existing = memberRepository.findByCalendarAndUser(calendar, user);
        if (existing.isPresent()) return toSummary(calendar, existing.get().getRole());

        CalendarMember member = memberRepository.save(new CalendarMember(calendar, user, Role.EDITOR));

        // Mark this person's email invite (if any) as accepted
        String email = user.getEmail().toLowerCase(Locale.ROOT);
        inviteRepository.findByCalendarAndEmail(calendar, email).ifPresent(i -> i.setAcceptedAt(LocalDateTime.now()));
        if (resolved.invite() != null && resolved.invite().getAcceptedAt() == null) {
            resolved.invite().setAcceptedAt(LocalDateTime.now());
        }

        // Let the owner know, in the app and by email
        User owner = calendar.getOwner();
        if (!owner.getId().equals(user.getId())) {
            String link = "/calendars/" + calendar.getId();
            notificationService.notify(owner, "👋 " + user.getName() + " joined \"" + calendar.getName() + "\"",
                    Notification.NotificationType.CALENDAR, link);
            if (!Boolean.FALSE.equals(owner.getEmailNotifications())) {
                emailService.sendMemberJoined(owner.getEmail(), owner.getName(), user.getName(),
                        calendar.getName(), emailService.appUrl(link));
            }
        }
        log.info("User {} joined calendar {}", user.getId(), calendar.getId());
        return toSummary(calendar, member.getRole());
    }

    // ── Email invites ──────────────────────────────────────────────────────

    /**
     * Owner invites people by email. Each person gets an email with their own join link
     * (and an in-app notification if they already have an account); the owner gets a
     * confirmation email listing who was invited. Re-inviting someone re-sends their email.
     */
    @Transactional
    public InviteResult inviteByEmail(User user, Long calendarId, List<String> rawEmails) {
        SharedCalendar calendar = requireOwner(user, calendarId).getCalendar();
        if (rawEmails == null || rawEmails.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one email address");
        }
        Set<String> emails = new LinkedHashSet<>();
        List<String> invalid = new ArrayList<>();
        for (String raw : rawEmails) {
            String e = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
            if (e.isEmpty()) continue;
            if (e.length() > 254 || !EMAIL.matcher(e).matches()) invalid.add(raw.trim());
            else emails.add(e);
        }
        if (emails.size() > MAX_EMAILS_PER_REQUEST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You can invite up to " + MAX_EMAILS_PER_REQUEST + " people at a time");
        }
        if (inviteRepository.countByCalendarAndAcceptedAtIsNull(calendar) + emails.size() > MAX_PENDING_INVITES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This calendar has too many pending invites. Cancel some first.");
        }

        Set<String> memberEmails = new java.util.HashSet<>();
        memberRepository.findByCalendarWithUser(calendar)
                .forEach(m -> memberEmails.add(m.getUser().getEmail().toLowerCase(Locale.ROOT)));

        List<String> invited = new ArrayList<>();
        List<String> alreadyMembers = new ArrayList<>();
        for (String email : emails) {
            if (memberEmails.contains(email)) {
                alreadyMembers.add(email);
                continue;
            }
            CalendarInvite invite = inviteRepository.findByCalendarAndEmail(calendar, email).orElseGet(() -> {
                CalendarInvite i = new CalendarInvite();
                i.setCalendar(calendar);
                i.setEmail(email);
                i.setToken(newToken());
                return i;
            });
            invite.setInvitedBy(user);
            invite.setInvitedAt(LocalDateTime.now());
            invite.setAcceptedAt(null);
            inviteRepository.save(invite);

            String joinPath = "/join/" + invite.getToken();
            var existingUser = userRepository.findByEmail(email)
                    .or(() -> userRepository.findByEmailIgnoreCase(email));
            existingUser.ifPresent(u -> notificationService.notify(u,
                    "📅 " + user.getName() + " invited you to join \"" + calendar.getName() + "\"",
                    Notification.NotificationType.CALENDAR, joinPath));
            emailService.sendCalendarInvite(email, user.getName(), calendar.getName(),
                    emailService.appUrl(joinPath), existingUser.isPresent());
            invited.add(email);
        }

        if (!invited.isEmpty()) {
            emailService.sendInvitesSentConfirmation(user.getEmail(), user.getName(), calendar.getName(),
                    invited, emailService.appUrl("/calendars/" + calendar.getId()));
        }
        log.info("Calendar {}: invited {}, already members {}, invalid {}", calendar.getId(),
                invited.size(), alreadyMembers.size(), invalid.size());
        return new InviteResult(invited, alreadyMembers, invalid);
    }

    /** Cancels a pending email invite; its link stops working. */
    @Transactional
    public void cancelInvite(User user, Long calendarId, Long inviteId) {
        SharedCalendar calendar = requireOwner(user, calendarId).getCalendar();
        CalendarInvite invite = inviteRepository.findById(inviteId)
                .filter(i -> i.getCalendar().getId().equals(calendar.getId()) && i.getAcceptedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found"));
        inviteRepository.delete(invite);
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
        CalendarEvent saved = eventRepository.save(event);
        notifyOtherMembers(me, user, "➕ " + user.getName() + " added \"" + saved.getTitle() + "\" to \""
                + me.getCalendar().getName() + "\"");
        return saved;
    }

    @Transactional
    public CalendarEvent updateEvent(User user, Long calendarId, Long eventId, CalendarEvent changes) {
        CalendarEvent existing = requireEventInCalendar(requireEditor(user, calendarId), eventId);
        if (changes.getTitle() != null) existing.setTitle(changes.getTitle());
        if (changes.getDescription() != null) existing.setDescription(changes.getDescription());
        if (changes.getStartTime() != null) existing.setStartTime(changes.getStartTime());
        if (changes.getEndTime() != null) existing.setEndTime(changes.getEndTime());
        if (changes.getType() != null) existing.setType(changes.getType());
        boolean justCompleted = Boolean.TRUE.equals(changes.getCompleted()) && !Boolean.TRUE.equals(existing.getCompleted());
        if (changes.getCompleted() != null) existing.setCompleted(changes.getCompleted());
        CalendarEvent saved = eventRepository.save(existing);
        if (justCompleted) {
            CalendarMember me = requireMember(user, calendarId);
            notifyOtherMembers(me, user, "✅ " + user.getName() + " checked off \"" + saved.getTitle() + "\" in \""
                    + me.getCalendar().getName() + "\"");
        }
        return saved;
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

    private record ResolvedToken(SharedCalendar calendar, CalendarInvite invite) {}

    /**
     * A join token is either the calendar's share link or a personal email invite. Invites stay
     * valid after they're used so clicking the email again still opens the calendar; cancelling
     * an invite deletes it, which disables the link.
     */
    private ResolvedToken resolveToken(String token) {
        var byShare = calendarRepository.findByShareToken(token);
        if (byShare.isPresent()) return new ResolvedToken(byShare.get(), null);
        return inviteRepository.findByToken(token)
                .map(i -> new ResolvedToken(i.getCalendar(), i))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "This invite link is invalid, was cancelled, or has been reset"));
    }

    /** In-app only: shared-calendar activity would be too noisy by email. */
    private void notifyOtherMembers(CalendarMember actor, User actorUser, String message) {
        String link = "/calendars/" + actor.getCalendar().getId();
        memberRepository.findByCalendarWithUser(actor.getCalendar()).stream()
                .map(CalendarMember::getUser)
                .filter(u -> !u.getId().equals(actorUser.getId()))
                .forEach(u -> notificationService.notify(u, message, Notification.NotificationType.CALENDAR, link));
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
