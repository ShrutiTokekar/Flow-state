package com.taskmanager.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Small, idempotent schema fixes that ddl-auto=update can't make on its own.
 *
 * Hibernate creates a CHECK constraint listing an enum's values when it first creates a
 * column, but never updates it when new values are added. These constraints would reject
 * the new CALENDAR notification type and BOTH reminder type, so they're dropped here
 * (the enum on the Java side still limits what gets written).
 */
@Component
public class SchemaFixes {

    private static final Logger log = LoggerFactory.getLogger(SchemaFixes.class);

    private static final String[] STATEMENTS = {
        "ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check",
        "ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_reminder_type_check",
    };

    private final JdbcTemplate jdbc;

    public SchemaFixes(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void apply() {
        for (String sql : STATEMENTS) {
            try {
                jdbc.execute(sql);
            } catch (Exception e) {
                log.warn("Schema fix skipped ({}): {}", sql, e.getMessage());
            }
        }
    }
}
