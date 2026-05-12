package com.taskmanager.repository;

import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserOrderByCreatedAtDesc(User user);
    List<Task> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);
    List<Task> findByUserAndCategoryIdOrderByCreatedAtDesc(User user, Long categoryId);

    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.dueDate BETWEEN :start AND :end ORDER BY t.dueDate ASC")
    List<Task> findTasksDueWithinRange(User user, LocalDateTime start, LocalDateTime end);

    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.dueDate < :now AND t.status != 'DONE' ORDER BY t.dueDate ASC")
    List<Task> findOverdueTasks(User user, LocalDateTime now);

    Long countByUserAndStatus(User user, String status);

    // Used by NotificationScheduler
    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :start AND :end AND t.status != :status")
    List<Task> findByDueDateBetweenAndStatusNot(LocalDateTime start, LocalDateTime end, String status);

    @Query("SELECT t FROM Task t WHERE t.dueDate < :before AND t.status != :status")
    List<Task> findByDueDateBeforeAndStatusNot(LocalDateTime before, String status);
}