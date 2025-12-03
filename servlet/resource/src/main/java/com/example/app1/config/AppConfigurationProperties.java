package com.example.app1.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppConfigurationProperties {
    private JwtConfiguration jwt;

    @Getter
    @Setter
    public static class JwtConfiguration {
        private String issuerUri;
        private String jwkSetUri;
        private String audiences;
    }
}