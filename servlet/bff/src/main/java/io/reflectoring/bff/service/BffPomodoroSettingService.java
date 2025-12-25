package io.reflectoring.bff.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.PomodoroSettingDto;

@Service
public class BffPomodoroSettingService {

    private static final Logger log = LoggerFactory.getLogger(BffPomodoroSettingService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffPomodoroSettingService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
        this.resourceUrl = appProperties.getResourceServerUrl() + "/api/settings/pomodoro";
    }

    public PomodoroSettingDto.Response getSettings(String token) {
        log.info("Fetching pomodoro settings from Resource Server");
        PomodoroSettingDto.Response settings = restClient.get()
                .uri(resourceUrl)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(PomodoroSettingDto.Response.class);

        log.info("Successfully fetched pomodoro settings");
        return settings;
    }

    public PomodoroSettingDto.Response updateSettings(String token, PomodoroSettingDto.Request settings) {
        log.info("Updating pomodoro settings in Resource Server");
        PomodoroSettingDto.Response updatedSettings = restClient.patch()
                .uri(resourceUrl)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(settings)
                .retrieve()
                .body(PomodoroSettingDto.Response.class);

        log.info("Successfully updated pomodoro settings");
        return updatedSettings;
    }
}
