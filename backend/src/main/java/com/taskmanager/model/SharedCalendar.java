package com.taskmanager.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * A calendar that can be shared with other users through an invite link.
 * Events that belong to it live in calendar_events with calendar_id set.
 */
@Entity
@Table(name = "shared_calendars")
public class SharedCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 7)
    private String color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // Secret, unguessable token used in the invite link. Regenerating it revokes old links.
    @Column(name = "share_token", nullable = false, unique = true, length = 64)
    private String shareToken;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public String getShareToken() { return shareToken; }
    public void setShareToken(String shareToken) { this.shareToken = shareToken; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
