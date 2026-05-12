package com.taskmanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "user_calendar_settings")
public class UserCalendarSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "google_calendar_id")
    private String googleCalendarId;
    
    @Column(name = "google_refresh_token")
    private String googleRefreshToken;
    
    @Column(name = "sync_enabled")
    private Boolean syncEnabled = false;
    
    @Column(name = "default_reminder_minutes")
    private Integer defaultReminderMinutes = 15;
    
    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;
    
    @Column(name = "push_notifications")
    private Boolean pushNotifications = true;
    
    // Constructors
    public UserCalendarSettings() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getGoogleCalendarId() {
        return googleCalendarId;
    }
    
    public void setGoogleCalendarId(String googleCalendarId) {
        this.googleCalendarId = googleCalendarId;
    }
    
    public String getGoogleRefreshToken() {
        return googleRefreshToken;
    }
    
    public void setGoogleRefreshToken(String googleRefreshToken) {
        this.googleRefreshToken = googleRefreshToken;
    }
    
    public Boolean getSyncEnabled() {
        return syncEnabled;
    }
    
    public void setSyncEnabled(Boolean syncEnabled) {
        this.syncEnabled = syncEnabled;
    }
    
    public Integer getDefaultReminderMinutes() {
        return defaultReminderMinutes;
    }
    
    public void setDefaultReminderMinutes(Integer defaultReminderMinutes) {
        this.defaultReminderMinutes = defaultReminderMinutes;
    }
    
    public Boolean getEmailNotifications() {
        return emailNotifications;
    }
    
    public void setEmailNotifications(Boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }
    
    public Boolean getPushNotifications() {
        return pushNotifications;
    }
    
    public void setPushNotifications(Boolean pushNotifications) {
        this.pushNotifications = pushNotifications;
    }
}