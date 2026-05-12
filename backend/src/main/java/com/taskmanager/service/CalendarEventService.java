package com.taskmanager.service;

import com.taskmanager.model.CalendarEvent;
import com.taskmanager.model.User;
import com.taskmanager.repository.CalendarEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CalendarEventService {
    
    private static final Logger log = LoggerFactory.getLogger(CalendarEventService.class);
    
    private final CalendarEventRepository calendarEventRepository;
    
    @Autowired
    public CalendarEventService(CalendarEventRepository calendarEventRepository) {
        this.calendarEventRepository = calendarEventRepository;
    }
    
    /**
     * Get all events for a user
     */
    public List<CalendarEvent> getEventsForUser(User user) {
        return calendarEventRepository.findByUserOrderByStartTimeAsc(user);
    }
    
    /**
     * Get events within a date range
     */
    public List<CalendarEvent> getEventsByDateRange(User user, LocalDateTime start, LocalDateTime end) {
        return calendarEventRepository.findByUserAndStartTimeBetween(user, start, end);
    }
    
    /**
     * Create a new calendar event
     */
    @Transactional
    public CalendarEvent createEvent(User user, CalendarEvent event) {
        event.setUser(user);
        
        // Set default values if not provided
        if (event.getType() == null) {
            event.setType("event");
        }
        if (event.getColor() == null) {
            event.setColor("#8894d1"); // Default Flow State purple
        }
        
        CalendarEvent saved = calendarEventRepository.save(event);
        log.info("Created calendar event: {} for user: {}", saved.getId(), user.getEmail());
        return saved;
    }
    
    /**
     * Update an existing calendar event
     */
    @Transactional
    public CalendarEvent updateEvent(User user, Long eventId, CalendarEvent updatedEvent) {
        CalendarEvent existing = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found with id: " + eventId));
        
        // Verify ownership
        if (!existing.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to calendar event");
        }
        
        // Update fields
        if (updatedEvent.getTitle() != null) {
            existing.setTitle(updatedEvent.getTitle());
        }
        if (updatedEvent.getDescription() != null) {
            existing.setDescription(updatedEvent.getDescription());
        }
        if (updatedEvent.getStartTime() != null) {
            existing.setStartTime(updatedEvent.getStartTime());
        }
        if (updatedEvent.getEndTime() != null) {
            existing.setEndTime(updatedEvent.getEndTime());
        }
        if (updatedEvent.getType() != null) {
            existing.setType(updatedEvent.getType());
        }
        if (updatedEvent.getColor() != null) {
            existing.setColor(updatedEvent.getColor());
        }
        if (updatedEvent.getTaskId() != null) {
            existing.setTaskId(updatedEvent.getTaskId());
        }
        
        CalendarEvent saved = calendarEventRepository.save(existing);
        log.info("Updated calendar event: {}", eventId);
        return saved;
    }
    
    /**
     * Delete a calendar event
     */
    @Transactional
    public void deleteEvent(User user, Long eventId) {
        CalendarEvent event = calendarEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found with id: " + eventId));
        
        // Verify ownership
        if (!event.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to calendar event");
        }
        
        calendarEventRepository.delete(event);
        log.info("Deleted calendar event: {}", eventId);
    }
    
    /**
     * Get event by task ID
     */
    public CalendarEvent getEventByTaskId(Long taskId) {
        return calendarEventRepository.findByTaskId(taskId).orElse(null);
    }
    
    /**
     * Delete event by task ID
     */
    @Transactional
    public void deleteEventByTaskId(Long taskId) {
        calendarEventRepository.deleteByTaskId(taskId);
        log.info("Deleted calendar event for task: {}", taskId);
    }
    
    /**
     * Create event from task
     */
    @Transactional
    public CalendarEvent createEventFromTask(User user, Long taskId, String title, String description, LocalDateTime dueDate) {
        CalendarEvent event = new CalendarEvent();
        event.setUser(user);
        event.setTaskId(taskId);
        event.setTitle(title);
        event.setDescription(description);
        event.setStartTime(dueDate);
        event.setEndTime(dueDate);
        event.setType("task");
        event.setColor("#dfa4c6"); // Pink for tasks
        
        CalendarEvent saved = calendarEventRepository.save(event);
        log.info("Created calendar event from task: {}", taskId);
        return saved;
    }
}