package com.taskmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** An email invitation to a shared calendar. Each invite has its own join link. */
@Entity
@Table(name = "calendar_invites",
       uniqueConstraints = @UniqueConstraint(columnNames = {"calendar_id", "email"}))
public class CalendarInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    private SharedCalendar calendar;

    // Stored lowercase
    @Column(nullable = false, length = 254)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_id", nullable = false)
    private User invitedBy;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(name = "invited_at", nullable = false)
    private LocalDateTime invitedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    public Long getId() { return id; }

    public SharedCalendar getCalendar() { return calendar; }
    public void setCalendar(SharedCalendar calendar) { this.calendar = calendar; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public User getInvitedBy() { return invitedBy; }
    public void setInvitedBy(User invitedBy) { this.invitedBy = invitedBy; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getInvitedAt() { return invitedAt; }
    public void setInvitedAt(LocalDateTime invitedAt) { this.invitedAt = invitedAt; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
}
