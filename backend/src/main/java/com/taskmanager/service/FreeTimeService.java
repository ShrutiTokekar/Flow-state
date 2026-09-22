package com.taskmanager.service;

import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.User;
import com.taskmanager.repository.CalendarEventRepository;
import com.taskmanager.repository.CalendarMemberRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;

/**
 * Finds open time in a date range by subtracting busy events from each day's
 * "available hours" window (e.g. 8am–10pm).
 */
@Service
public class FreeTimeService {

    public record Interval(LocalDateTime start, LocalDateTime end) {}

    public record FreeSlot(LocalDateTime start, LocalDateTime end, long minutes) {}

    private final CalendarEventRepository eventRepository;
    private final CalendarMemberRepository memberRepository;

    public FreeTimeService(CalendarEventRepository eventRepository,
                           CalendarMemberRepository memberRepository) {
        this.eventRepository = eventRepository;
        this.memberRepository = memberRepository;
    }

    /**
     * Free time shared by every user in {@code users}. A time is busy if any of them has
     * a personal event, or an event on any shared calendar they belong to, at that time.
     */
    public List<FreeSlot> findFreeTime(Collection<User> users, LocalDate from, LocalDate to,
                                       LocalTime dayStart, LocalTime dayEnd, int minMinutes) {
        LocalDateTime rangeStart = from.atStartOfDay();
        LocalDateTime rangeEnd = to.plusDays(1).atStartOfDay();

        List<Interval> busy = new ArrayList<>();
        eventRepository.findPersonalOverlapping(users, rangeStart, rangeEnd)
                .forEach(e -> busy.add(toInterval(e)));

        List<Long> calendarIds = memberRepository.findCalendarIdsForUsers(users);
        if (!calendarIds.isEmpty()) {
            eventRepository.findInCalendarsOverlapping(calendarIds, rangeStart, rangeEnd)
                    .forEach(e -> busy.add(toInterval(e)));
        }

        return computeFreeSlots(busy, from, to, dayStart, dayEnd, minMinutes, LocalDateTime.now());
    }

    private static Interval toInterval(CalendarEvent e) {
        return new Interval(e.getStartTime(), e.getEndTime());
    }

    /**
     * Pure computation, kept static so it can be unit tested without a database.
     * Time before {@code now} is never reported as free.
     */
    static List<FreeSlot> computeFreeSlots(List<Interval> busy, LocalDate from, LocalDate to,
                                           LocalTime dayStart, LocalTime dayEnd, int minMinutes,
                                           LocalDateTime now) {
        List<Interval> sorted = busy.stream()
                .filter(i -> i.end().isAfter(i.start())) // zero-length items (e.g. deadlines) don't block time
                .sorted(Comparator.comparing(Interval::start))
                .toList();

        List<FreeSlot> slots = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            LocalDateTime windowStart = day.atTime(dayStart);
            LocalDateTime windowEnd = dayEnd.equals(LocalTime.MIDNIGHT) || !dayEnd.isAfter(dayStart)
                    ? day.plusDays(1).atStartOfDay()
                    : day.atTime(dayEnd);

            LocalDateTime cursor = windowStart.isBefore(now) ? roundUpToQuarterHour(now) : windowStart;
            for (Interval b : sorted) {
                if (!cursor.isBefore(windowEnd)) break;
                if (!b.end().isAfter(cursor) || !b.start().isBefore(windowEnd)) continue;
                if (b.start().isAfter(cursor)) {
                    addIfLongEnough(slots, cursor, b.start(), minMinutes);
                }
                if (b.end().isAfter(cursor)) cursor = b.end();
            }
            if (cursor.isBefore(windowEnd)) {
                addIfLongEnough(slots, cursor, windowEnd, minMinutes);
            }
        }
        return slots;
    }

    private static void addIfLongEnough(List<FreeSlot> slots, LocalDateTime start, LocalDateTime end, int minMinutes) {
        long minutes = ChronoUnit.MINUTES.between(start, end);
        if (minutes >= minMinutes) {
            slots.add(new FreeSlot(start, end, minutes));
        }
    }

    private static LocalDateTime roundUpToQuarterHour(LocalDateTime t) {
        LocalDateTime truncated = t.truncatedTo(ChronoUnit.MINUTES);
        int remainder = truncated.getMinute() % 15;
        LocalDateTime rounded = remainder == 0 ? truncated : truncated.plusMinutes(15 - remainder);
        return rounded.isBefore(t) ? rounded.plusMinutes(15) : rounded;
    }
}
