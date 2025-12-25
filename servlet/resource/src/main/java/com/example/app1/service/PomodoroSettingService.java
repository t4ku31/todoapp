package com.example.app1.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.app1.domain.PomodoroSetting;
import com.example.app1.repository.PomodoroSettingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PomodoroSettingService {

    private final PomodoroSettingRepository repository;

    public PomodoroSetting getSettings(String userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(userId));
    }

    @Transactional
    public PomodoroSetting updateSettings(String userId, PomodoroSetting newSettings) {
        PomodoroSetting existing = repository.findByUserId(userId)
                .orElseGet(() -> {
                    PomodoroSetting defaults = createDefaultSettings(userId);
                    // Ensure the ID is set if createDefault didn't persist it yet (it mostly just
                    // returns an object)
                    defaults.setUserId(userId);
                    return defaults;
                });

        // Update fields
        if (newSettings.getFocusDuration() != null)
            existing.setFocusDuration(newSettings.getFocusDuration());
        if (newSettings.getShortBreakDuration() != null)
            existing.setShortBreakDuration(newSettings.getShortBreakDuration());
        if (newSettings.getLongBreakDuration() != null)
            existing.setLongBreakDuration(newSettings.getLongBreakDuration());
        if (newSettings.getLongBreakInterval() != null)
            existing.setLongBreakInterval(newSettings.getLongBreakInterval());
        if (newSettings.getIsLongBreakEnabled() != null)
            existing.setIsLongBreakEnabled(newSettings.getIsLongBreakEnabled());
        if (newSettings.getDailyGoal() != null)
            existing.setDailyGoal(newSettings.getDailyGoal());
        if (newSettings.getAutoAdvance() != null)
            existing.setAutoAdvance(newSettings.getAutoAdvance());
        if (newSettings.getWhiteNoise() != null)
            existing.setWhiteNoise(newSettings.getWhiteNoise());
        if (newSettings.getVolume() != null)
            existing.setVolume(newSettings.getVolume());

        return repository.save(existing);
    }

    private PomodoroSetting createDefaultSettings(String userId) {
        log.info("Creating default pomodoro settings for user: {}", userId);
        PomodoroSetting settings = new PomodoroSetting();
        settings.setUserId(userId);
        settings.setFocusDuration(25);
        settings.setShortBreakDuration(5);
        settings.setLongBreakDuration(15);
        settings.setLongBreakInterval(4);
        settings.setIsLongBreakEnabled(true);
        settings.setDailyGoal(120);
        settings.setAutoAdvance(false);
        settings.setWhiteNoise("none");
        settings.setVolume(0.5);
        return repository.save(settings);
    }
}
