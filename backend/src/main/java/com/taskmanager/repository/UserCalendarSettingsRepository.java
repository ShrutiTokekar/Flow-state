package com.taskmanager.repository;

import com.taskmanager.model.User;
import com.taskmanager.model.UserCalendarSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCalendarSettingsRepository extends JpaRepository<UserCalendarSettings, Long> {
    
    Optional<UserCalendarSettings> findByUser(User user);
    
    Optional<UserCalendarSettings> findByUserId(Long userId);
}