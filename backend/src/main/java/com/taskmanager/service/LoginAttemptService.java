package com.taskmanager.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-account brute-force protection: after too many wrong passwords for one email, that
 * account's logins are refused for a while, no matter which IP address they come from
 * (IP rate limiting alone doesn't stop attacks spread across many addresses).
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILURES = 10;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final int MAX_TRACKED_ACCOUNTS = 100_000; // bounds memory under a spray attack

    private record Attempts(int failures, Instant firstFailure, Instant lockedUntil) {}

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    /** Seconds until the account unlocks, or 0 if logins are allowed. */
    public long secondsLocked(String email) {
        Attempts a = attempts.get(key(email));
        if (a == null || a.lockedUntil() == null) return 0;
        long seconds = Duration.between(Instant.now(), a.lockedUntil()).getSeconds();
        return Math.max(0, seconds);
    }

    public void recordFailure(String email) {
        if (attempts.size() >= MAX_TRACKED_ACCOUNTS) cleanup();
        Instant now = Instant.now();
        attempts.compute(key(email), (k, a) -> {
            if (a == null || a.firstFailure().plus(WINDOW).isBefore(now)) {
                return new Attempts(1, now, null);
            }
            int failures = a.failures() + 1;
            Instant lockedUntil = failures >= MAX_FAILURES ? now.plus(WINDOW) : a.lockedUntil();
            return new Attempts(failures, a.firstFailure(), lockedUntil);
        });
    }

    public void recordSuccess(String email) {
        attempts.remove(key(email));
    }

    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void cleanup() {
        Instant now = Instant.now();
        attempts.entrySet().removeIf(e -> {
            Attempts a = e.getValue();
            Instant expires = a.lockedUntil() != null ? a.lockedUntil() : a.firstFailure().plus(WINDOW);
            return expires.isBefore(now);
        });
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
