package com.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.config.AppConfigurationProperties;

import io.jsonwebtoken.security.Keys;

@Configuration
@EnableConfigurationProperties(AppConfigurationProperties.class)
public class JwtConfig {
    private final AppConfigurationProperties properties;

    public JwtConfig(AppConfigurationProperties properties) {
        this.properties = properties;
    }

    @Bean
    public SecretKey jwtSecretKey() {
        String secret = properties.getJwt().getSecret();
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
