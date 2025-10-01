package com.example.app1.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.app1.service.RefreshTokenService;
import com.example.app1.utils.JwtUtils;
import com.example.app1.dto.AuthResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RefreshTokenController {
    private final RefreshTokenService refreshTokenService;
    private final JwtUtils jwtUtils;

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@CookieValue(name = "refreshToken") String refreshToken) {
        return refreshTokenService.findByToken(refreshToken)
                .map(token -> {
                    refreshTokenService.verifyExpiration(token);
                    String jwt = jwtUtils.generateToken(token.getUser().getEmail());
                    
                    HttpHeaders headers = new HttpHeaders();
                    headers.add(HttpHeaders.SET_COOKIE, 
                        String.format("refreshToken=%s; HttpOnly; Path=/api", refreshToken));
                    
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(AuthResponse.builder()
                                    .token(jwt)
                                    .refreshToken(refreshToken)
                                    .build());
                })
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
    }
}
