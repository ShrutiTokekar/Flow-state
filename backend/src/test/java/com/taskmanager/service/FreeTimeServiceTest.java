package com.taskmanager.service;

import com.taskmanager.service.FreeTimeService.FreeSlot;
import com.taskmanager.service.FreeTimeService.Interval;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FreeTimeServiceTest {

    private static final LocalDate MON = LocalDate.of(2030, 1, 7);
    private static final LocalTime NINE = LocalTime.of(9, 0);
    private static final LocalTime FIVE_PM = LocalTime.of(17, 0);
    private static final LocalDateTime LONG_AGO = LocalDateTime.of(2000, 1, 1, 0, 0);

    private static Interval busy(LocalDate d, String start, String end) {
        return new Interval(d.atTime(LocalTime.parse(start)), d.atTime(LocalTime.parse(end)));
    }

    @Test
    void emptyDayIsOneBigSlot() {
        List<FreeSlot> slots = FreeTimeService.computeFreeSlots(List.of(), MON, MON, NINE, FIVE_PM, 30, LONG_AGO);
        assertThat(slots).containsExactly(new FreeSlot(MON.atTime(NINE), MON.atTime(FIVE_PM), 480));
    }

    @Test
    void overlappingAndUnsortedEventsAreMerged() {
        List<Interval> busy = List.of(
                busy(MON, "13:00", "14:00"),
                busy(MON, "10:00", "11:30"),
                busy(MON, "11:00", "12:00"));
        List<FreeSlot> slots = FreeTimeService.computeFreeSlots(busy, MON, MON, NINE, FIVE_PM, 30, LONG_AGO);
        assertThat(slots).extracting(s -> s.start().toLocalTime() + "-" + s.end().toLocalTime())
                .containsExactly("09:00-10:00", "12:00-13:00", "14:00-17:00");
    }

    @Test
    void gapsShorterThanMinimumAreDropped() {
        List<Interval> busy = List.of(busy(MON, "09:15", "12:00"), busy(MON, "12:20", "17:00"));
        assertThat(FreeTimeService.computeFreeSlots(busy, MON, MON, NINE, FIVE_PM, 30, LONG_AGO)).isEmpty();
    }

    @Test
    void eventsSpanningMidnightBlockBothDays() {
        LocalDate tue = MON.plusDays(1);
        Interval overnight = new Interval(MON.atTime(16, 0), tue.atTime(10, 0));
        List<FreeSlot> slots = FreeTimeService.computeFreeSlots(List.of(overnight), MON, tue, NINE, FIVE_PM, 30, LONG_AGO);
        assertThat(slots).containsExactly(
                new FreeSlot(MON.atTime(NINE), MON.atTime(16, 0), 420),
                new FreeSlot(tue.atTime(10, 0), tue.atTime(FIVE_PM), 420));
    }

    @Test
    void zeroLengthItemsDoNotBlockTime() {
        Interval deadline = busy(MON, "12:00", "12:00");
        assertThat(FreeTimeService.computeFreeSlots(List.of(deadline), MON, MON, NINE, FIVE_PM, 30, LONG_AGO))
                .hasSize(1);
    }

    @Test
    void timeBeforeNowIsNotFree() {
        LocalDateTime now = MON.atTime(11, 7);
        List<FreeSlot> slots = FreeTimeService.computeFreeSlots(List.of(), MON, MON, NINE, FIVE_PM, 30, now);
        assertThat(slots).containsExactly(new FreeSlot(MON.atTime(11, 15), MON.atTime(FIVE_PM), 345));
    }

    @Test
    void midnightDayEndMeansEndOfDay() {
        List<FreeSlot> slots = FreeTimeService.computeFreeSlots(List.of(), MON, MON, LocalTime.of(20, 0),
                LocalTime.MIDNIGHT, 30, LONG_AGO);
        assertThat(slots).containsExactly(new FreeSlot(MON.atTime(20, 0), MON.plusDays(1).atStartOfDay(), 240));
    }
}
