package com.taskmanager.repository;

import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.SharedCalendar;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    // Personal events only — events a user created on shared calendars are excluded.
    // Events are serialized after the transaction ends (createdByName reads the user), so load it up front
    @EntityGraph(attributePaths = "user")
    List<CalendarEvent> findByUserAndCalendarIsNullOrderByStartTimeAsc(User user);

    @EntityGraph(attributePaths = "user")
    List<CalendarEvent> findByCalendarOrderByStartTimeAsc(SharedCalendar calendar);

    @EntityGraph(attributePaths = "user")
    Optional<CalendarEvent> findWithUserById(Long id);

    @Query("select e from CalendarEvent e where e.user in :users and e.calendar is null " +
           "and e.startTime < :end and e.endTime > :start")
    List<CalendarEvent> findPersonalOverlapping(@Param("users") Collection<User> users,
                                                @Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end);

    @Query("select e from CalendarEvent e where e.calendar.id in :calendarIds " +
           "and e.startTime < :end and e.endTime > :start")
    List<CalendarEvent> findInCalendarsOverlapping(@Param("calendarIds") Collection<Long> calendarIds,
                                                   @Param("start") LocalDateTime start,
                                                   @Param("end") LocalDateTime end);

    @Modifying
    void deleteByCalendar(SharedCalendar calendar);

    List<CalendarEvent> findByUserAndStartTimeBetween(User user, LocalDateTime start, LocalDateTime end);

    Optional<CalendarEvent> findByTaskId(Long taskId);

    void deleteByTaskId(Long taskId);
}