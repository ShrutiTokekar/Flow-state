package com.taskmanager.repository;

import com.taskmanager.model.SharedCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SharedCalendarRepository extends JpaRepository<SharedCalendar, Long> {

    Optional<SharedCalendar> findByShareToken(String shareToken);
}
