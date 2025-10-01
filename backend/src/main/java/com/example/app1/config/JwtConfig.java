package com.example.app1.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.app1.config.AppConfigurationProperties;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;

@Slf4j
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
