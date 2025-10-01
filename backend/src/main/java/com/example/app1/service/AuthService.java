package com.example.app1.service;

import com.example.app1.dto.AuthResponse;
import com.example.app1.model.User;
import com.example.app1.repository.UserRepository;
import com.example.app1.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;
import java.util.logging.Logger;

@Validated
@Service
@RequiredArgsConstructor
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;

    private static final Logger logger = Logger.getLogger(AuthService.class.getName());

    public AuthResponse signin(String email, String password) {
        logger.fine("input check - email: " + email + ", password: " + password);

        User user = userRepository.findByEmail(email);

        if (user == null) {
            return null;
        }

        if (passwordEncoder.matches(password, user.getPassword())) {
            // JWT key and token generation
            String userId = user.getId().toString();

            String token = jwtUtils.generateToken(userId);
            logger.fine("Access token" + token);
            refreshTokenService.createRefreshToken(user.getId());
            return AuthResponse.builder()
                    .token(token)
                    .build();
        }

        return null;
    }

    public AuthResponse signup(String email, String password) {
        logger.info("Signup started for email: " + email+ ", password: " + password);
        // Validate request
        if (email == null || password == null) {
            throw new IllegalArgumentException("Email and password must not be null");
        }

        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already registered");
        }

        // Create new user
        User user = User.builder()
            .email(email)
            .password(passwordEncoder.encode(password))
            .build();

        // Save user and handle potential errors
        try {
            User savedUser = userRepository.save(user);
            logger.info("User saved: " + (savedUser != null ? savedUser.getEmail() : "null"));
            String userId = savedUser.getId().toString();

            String token = jwtUtils.generateToken(userId);
            refreshTokenService.createRefreshToken(savedUser.getId());

            return AuthResponse.builder()
                    .token(token)
                    .build();
        } catch (Exception e) {
            logger.severe("Failed to create user: " + e.getMessage());
            throw new RuntimeException("Failed to create user", e);
        }
    }
}