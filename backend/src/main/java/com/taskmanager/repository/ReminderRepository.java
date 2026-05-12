package com.taskmanager.repository;

import com.taskmanager.model.Reminder;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    
    List<Reminder> findByTaskOrderByReminderTimeAsc(Task task);
    
    List<Reminder> findByUserOrderByReminderTimeAsc(User user);
    
    @Query("SELECT r FROM Reminder r WHERE r.isSent = false " +
           "AND r.reminderTime <= :currentTime")
    List<Reminder> findPendingReminders(@Param("currentTime") LocalDateTime currentTime);
    
    List<Reminder> findByUserAndIsSentFalseOrderByReminderTimeAsc(User user);
    
    void deleteByTaskId(Long taskId);
}