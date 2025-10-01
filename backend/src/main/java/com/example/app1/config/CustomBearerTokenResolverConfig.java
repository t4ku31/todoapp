package com.example.app1.config;

import jakarta.servlet.http.Cookie;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.util.StringUtils;

import com.example.app1.controller.AuthController;

import java.util.logging.Logger;
@Configuration
public class CustomBearerTokenResolverConfig {

    private static final Logger logger = Logger.getLogger(AuthController.class.getName());
    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return request -> {
            String path = request.getRequestURI();
            // /auth/** のリクエストはトークン認証をスキップ
            if (path.startsWith("/auth/")) {
                return null;
            }

            // Cookie から取得
            if (request.getCookies() != null) { // cookieの一覧取得
                for (Cookie cookie : request.getCookies()) {
                    if ("accessToken".equals(cookie.getName())) {// accessTokenという名前のcookieがあれば返却
                        logger.fine("Token found in cookie: " + cookie.getValue());
                        return cookie.getValue();
                    }
                }
            }

            // Authorizationヘッダーがあればそこからトークンを取得
            String header = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
                logger.fine("Token found in Authorization header: " + header.substring(7));
                return header.substring(7);
            }

            logger.fine("No token found");
            return null;
        };
    }
}
