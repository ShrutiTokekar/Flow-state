package com.taskmanager.repository;

import com.taskmanager.model.Notification;
import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);

    Long countByUserAndIsReadFalse(User user);

    // Required to delete notifications before deleting a task (FK constraint)
    void deleteByTask(Task task);
}