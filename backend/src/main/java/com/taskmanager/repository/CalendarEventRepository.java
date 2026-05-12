package com.taskmanager.repository;

import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByUserOrderByStartTimeAsc(User user);

    List<CalendarEvent> findByUserAndStartTimeBetween(User user, LocalDateTime start, LocalDateTime end);

    Optional<CalendarEvent> findByTaskId(Long taskId);

    void deleteByTaskId(Long taskId);
}