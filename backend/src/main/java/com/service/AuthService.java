package com.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.beans.factory.annotation.Value;
import com.dto.AuthResponse;
import com.model.User;
import com.repository.UserRepository;
import com.utils.JwtUtils;

import javax.crypto.SecretKey;
import java.util.logging.Logger;

@Validated
@Service
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    private static final Logger logger = Logger.getLogger(AuthService.class.getName());

    public AuthService(
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            JwtUtils jwtUtils) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
    }

    public AuthResponse signin(String email, String password) {
        logger.fine("input check - email: " + email + ", password: " + password);

        User user = userRepository.findByEmail(email);

        if (user == null) {
            return null;
        }

        if (passwordEncoder.matches(password, user.getPassword())) {
            // JWT key and token generation
            String subject = user.getId().toString();
            String audience = user.getEmail().toString();
            String token = jwtUtils.generateToken(subject, audience);

            return AuthResponse.builder()
                    .token(token)
                    .build();
        }

        return null;
    }

    public AuthResponse signup(String email, String password) {
        logger.info("Signup started for email: " + email);
        String encodedPassword = passwordEncoder.encode(password);
        User user = new User(email, encodedPassword);
        User savedUser = userRepository.save(user);

        if (savedUser != null) {
            String subject = savedUser.getId().toString();
            String audience = savedUser.getEmail().toString();

            String token = jwtUtils.generateToken(subject, audience);

            return AuthResponse.builder()
                    .token(token)
                    .build();
        }
        return null;
    }

}