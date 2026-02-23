package com.todoapp.resource.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pomodoro_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PomodoroSetting {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "focus_duration")
    private Integer focusDuration;

    @Column(name = "short_break_duration")
    private Integer shortBreakDuration;

    @Column(name = "long_break_duration")
    private Integer longBreakDuration;

    @Column(name = "long_break_interval")
    private Integer longBreakInterval;

    @Column(name = "is_long_break_enabled")
    private Boolean isLongBreakEnabled;

    @Column(name = "daily_goal")
    private Integer dailyGoal;

    @Column(name = "auto_advance")
    private Boolean autoAdvance;

    @Column(name = "white_noise")
    private String whiteNoise;

    @Column(name = "volume")
    private Double volume;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
