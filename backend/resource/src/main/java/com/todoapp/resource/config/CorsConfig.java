package com.todoapp.resource.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS configuration for Resource Server.
 * Allows requests from BFF Server (internal Docker network) and Nginx-proxied
 * requests.
 */
@Configuration
public class CorsConfig {

    private final AppConfigurationProperties appProperties;

    public CorsConfig(AppConfigurationProperties appProperties) {
        this.appProperties = appProperties;
    }

    /**
     * Configure CORS to allow requests from BFF Server.
     * This is necessary because BFF and Resource Server are on different hosts
     * in the Docker network.
     */
    @Bean
    UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow BFF Server origin (Docker internal network)
        config.setAllowedOrigins(List.of(
                appProperties.getBffServerUrl(),
                appProperties.getBaseUrl() // For Nginx-proxied requests or production
        ));

        // Allow common HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Allow all headers (can be restricted later if needed)
        config.setAllowedHeaders(List.of("*"));

        // Allow credentials (cookies, authorization headers)
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
