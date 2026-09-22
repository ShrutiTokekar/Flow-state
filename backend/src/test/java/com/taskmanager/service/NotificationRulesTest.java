package com.taskmanager.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationRulesTest {

    @Test
    void dateOnlyTasksAreDueAtEndOfDay() {
        LocalDateTime midnight = LocalDateTime.of(2030, 1, 7, 0, 0);
        assertThat(NotificationScheduler.effectiveDeadline(midnight)).isEqualTo(midnight.plusDays(1));
    }

    @Test
    void timedTasksKeepTheirTime() {
        LocalDateTime threePm = LocalDateTime.of(2030, 1, 7, 15, 0);
        assertThat(NotificationScheduler.effectiveDeadline(threePm)).isEqualTo(threePm);
    }

    @Test
    void dueTextOmitsMidnight() {
        assertThat(NotificationService.dueText(LocalDateTime.of(2030, 1, 7, 0, 0))).isEqualTo("Mon, Jan 7");
        assertThat(NotificationService.dueText(LocalDateTime.of(2030, 1, 7, 15, 30))).isEqualTo("Mon, Jan 7 at 3:30 PM");
    }

    @Test
    void emailTextIsEscaped() {
        assertThat(EmailService.esc("<script>\"x\" & 'y'</script>"))
            .isEqualTo("&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;");
    }

    @Test
    void verificationTokensAreHashedDeterministically() {
        assertThat(EmailVerificationService.hash("abc")).hasSize(64).isEqualTo(EmailVerificationService.hash("abc"));
        assertThat(EmailVerificationService.hash("abc")).isNotEqualTo(EmailVerificationService.hash("abd"));
    }
}
