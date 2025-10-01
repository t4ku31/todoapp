
package com.example.app1.dto;

import java.time.Instant;

public record CreateRefreshTokenResponse(
        boolean success,
        String message,
        Long userId,
        Instant expiryDate) {

    public static CreateRefreshTokenResponse success(Long userId, Instant expiryDate) {
        return new CreateRefreshTokenResponse(true, "Token created successfully", userId, expiryDate);
    }

    public static CreateRefreshTokenResponse failure(String message) {
        return new CreateRefreshTokenResponse(false, message, null, null);
    }
}
