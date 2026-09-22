package com.taskmanager.repository;

import com.taskmanager.model.CalendarMember;
import com.taskmanager.model.SharedCalendar;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarMemberRepository extends JpaRepository<CalendarMember, Long> {

    @Query("select m from CalendarMember m join fetch m.calendar where m.user = :user order by m.calendar.name")
    List<CalendarMember> findByUserWithCalendar(@Param("user") User user);

    @Query("select m from CalendarMember m join fetch m.user where m.calendar = :calendar order by m.joinedAt")
    List<CalendarMember> findByCalendarWithUser(@Param("calendar") SharedCalendar calendar);

    Optional<CalendarMember> findByCalendarAndUser(SharedCalendar calendar, User user);

    Optional<CalendarMember> findByCalendarAndUserId(SharedCalendar calendar, Long userId);

    long countByCalendar(SharedCalendar calendar);

    @Query("select distinct m.calendar.id from CalendarMember m where m.user in :users")
    List<Long> findCalendarIdsForUsers(@Param("users") Collection<User> users);

    @Modifying
    void deleteByCalendar(SharedCalendar calendar);
}
