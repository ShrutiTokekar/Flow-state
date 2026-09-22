package com.taskmanager.repository;

import com.taskmanager.model.CalendarInvite;
import com.taskmanager.model.SharedCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarInviteRepository extends JpaRepository<CalendarInvite, Long> {

    List<CalendarInvite> findByCalendarAndAcceptedAtIsNullOrderByInvitedAtDesc(SharedCalendar calendar);

    Optional<CalendarInvite> findByCalendarAndEmail(SharedCalendar calendar, String email);

    Optional<CalendarInvite> findByToken(String token);

    long countByCalendarAndAcceptedAtIsNull(SharedCalendar calendar);

    @Modifying
    void deleteByCalendar(SharedCalendar calendar);
}
