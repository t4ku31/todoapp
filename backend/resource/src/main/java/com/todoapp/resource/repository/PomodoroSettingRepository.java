package com.todoapp.resource.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.todoapp.resource.domain.PomodoroSetting;

@Repository
public interface PomodoroSettingRepository extends JpaRepository<PomodoroSetting, String> {
    Optional<PomodoroSetting> findByUserId(String userId);
}
