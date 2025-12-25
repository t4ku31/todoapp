package com.example.app1.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.app1.domain.PomodoroSetting;

@Repository
public interface PomodoroSettingRepository extends JpaRepository<PomodoroSetting, String> {
    Optional<PomodoroSetting> findByUserId(String userId);
}
