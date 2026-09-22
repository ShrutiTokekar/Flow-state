package com.taskmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"calendar_id", "user_id"}))
public class CalendarMember {

    public enum Role { OWNER, EDITOR, VIEWER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    private SharedCalendar calendar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    public CalendarMember() {}

    public CalendarMember(SharedCalendar calendar, User user, Role role) {
        this.calendar = calendar;
        this.user = user;
        this.role = role;
    }

    public boolean canEdit() {
        return role == Role.OWNER || role == Role.EDITOR;
    }

    public Long getId() { return id; }

    public SharedCalendar getCalendar() { return calendar; }
    public void setCalendar(SharedCalendar calendar) { this.calendar = calendar; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
}
