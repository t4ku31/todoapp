package com.example.app1.controller;

import com.example.app1.config.AppConfigurationProperties;
import com.example.app1.service.AuthService;
import com.example.app1.service.RefreshTokenService;
import com.example.app1.dto.AuthRequest;
import com.example.app1.dto.AuthResponse;
import com.example.app1.utils.JwtUtils;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;

import javax.crypto.SecretKey;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.logging.Logger;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AppConfigurationProperties properties;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtils jwtUtils;
    private final SecretKey jwtSecretKey;
    private static final Logger logger = Logger.getLogger(AuthController.class.getName());

    public AuthController(AuthService authService, AppConfigurationProperties properties,
            RefreshTokenService refreshTokenService,
            JwtUtils jwtUtils,
            SecretKey jwtSecretKey) {
        this.authService = authService;
        this.properties = properties;
        this.refreshTokenService = refreshTokenService;
        this.jwtUtils = jwtUtils;
        this.jwtSecretKey = jwtSecretKey;
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signin(@RequestBody @Valid AuthRequest request,
            HttpServletResponse response) {

        String email = request.getEmail();
        String password = request.getPassword();
        // logger.fine("password from Authcontroller: " + password);
        // logger.fine("email from Authcontroller: " + email);
        AuthResponse auth = authService.signin(email, password);

        if (auth != null) {
            ResponseCookie cookie = ResponseCookie.from(properties.getCookie().getName(), auth.getToken())
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(properties.getCookie().getExpiresIn())
                    .sameSite("None")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.ok(auth);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody @Valid AuthRequest request,
            HttpServletResponse response) {
        String email = request.getEmail();
        String password = request.getPassword();

        logger.fine("authcontroller signup - email: " + email + ", password: " + password);
        AuthResponse auth = authService.signup(email, password);
        if (auth != null) {
            ResponseCookie cookie = ResponseCookie.from(properties.getCookie().getName(), auth.getToken())
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(properties.getCookie().getExpiresIn())
                    .sameSite("None")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.ok(auth);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    @PostMapping("/secretkey")
    public void secretkey(@CookieValue(value = "accessToken") String token,
            HttpServletResponse response) {
        String userId = jwtUtils.getPayload(token, jwtSecretKey).getSubject();
        logger.fine("secretkey" + jwtSecretKey + "userid" + userId);
    }

    @PostMapping("/signout")
    public ResponseEntity<Void> signout(
            @CookieValue(value = "accessToken") String token,
            HttpServletResponse response) {
        logger.fine("token from the cookie => " + token);
        String userId = jwtUtils.getPayload(token, jwtSecretKey).getSubject();
        logger.fine("token from the cookie => " + userId);
        try {
            Long uid = Long.parseLong(userId);
            refreshTokenService.deleteByUserId(uid);
            logger.fine("deleted refresh tokens for userId=" + uid);
        } catch (NumberFormatException ignore) {
            // ignore if subject isn't numeric
        }

        // クッキーを無効化（アクセス用クッキー名を設定から取得）
        ResponseCookie cookie = ResponseCookie.from(properties.getCookie().getName(), "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }

}
