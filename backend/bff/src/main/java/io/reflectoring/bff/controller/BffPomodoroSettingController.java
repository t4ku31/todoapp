package io.reflectoring.bff.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.reflectoring.bff.dto.PomodoroSettingDto;
import io.reflectoring.bff.service.BffPomodoroSettingService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/settings/pomodoro")
@RequiredArgsConstructor
public class BffPomodoroSettingController {

    private final BffPomodoroSettingService service;

    @GetMapping
    public ResponseEntity<PomodoroSettingDto.Response> getSettings(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        PomodoroSettingDto.Response settings = service.getSettings(client.getAccessToken().getTokenValue());
        return ResponseEntity.ok(settings);
    }

    @PatchMapping
    public ResponseEntity<PomodoroSettingDto.Response> updateSettings(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client,
            @RequestBody PomodoroSettingDto.Request settings) {
        PomodoroSettingDto.Response updatedSettings = service.updateSettings(client.getAccessToken().getTokenValue(),
                settings);
        return ResponseEntity.ok(updatedSettings);
    }
}
