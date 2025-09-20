package com.config;

import java.beans.BeanProperty;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Configuration;
import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import org.springframework.context.annotation.Bean;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "com.group.project") // provide proper prefix

public class AppConfigurationProperties {
    private JwtConfiguration jwt;
    private CookieConfiguration cookie;

    @Getter
    @Setter
    public static class JwtConfiguration {
        private String secret;
        private int expiresIn;
    }

    @Getter
    @Setter
    public static class CookieConfiguration {
        private String name;
        private int expiresIn;
    }
}