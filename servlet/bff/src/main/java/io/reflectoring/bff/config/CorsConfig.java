package io.reflectoring.bff.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS configuration for BFF Server.
 * Allows requests from frontend (via Nginx reverse proxy).
 */
@Configuration
public class CorsConfig {

    @Value("${app.base-url}")
    private String appBaseUrl;

    /**
     * Configure CORS to allow requests from frontend through Nginx.
     * Since Nginx proxies all requests under https://localhost,
     * this is the only origin we need to allow.
     */
    @Bean
    UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow frontend origin (Nginx-proxied)
        config.setAllowedOrigins(List.of(appBaseUrl));

        // Allow common HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Allow all headers (can be restricted later if needed)
        config.setAllowedHeaders(List.of("*"));

        // Allow credentials (cookies, session)
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
