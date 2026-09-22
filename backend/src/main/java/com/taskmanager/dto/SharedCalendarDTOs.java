package com.taskmanager.dto;

import com.taskmanager.model.CalendarMember;

import java.time.LocalDateTime;
import java.util.List;

/** Response shapes for the shared-calendar API. */
public final class SharedCalendarDTOs {

    private SharedCalendarDTOs() {}

    public record CalendarSummary(Long id, String name, String color, CalendarMember.Role role,
                                  String ownerName, long memberCount) {}

    /** shareToken is only included for the owner. */
    public record CalendarDetail(Long id, String name, String color, CalendarMember.Role role,
                                 String ownerName, String shareToken, List<Member> members) {}

    public record Member(Long userId, String name, String email, CalendarMember.Role role,
                         LocalDateTime joinedAt) {}

    /** What someone sees when they open an invite link, before joining. */
    public record InvitePreview(String name, String color, String ownerName, long memberCount) {}
}
