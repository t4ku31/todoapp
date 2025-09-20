package com.utils;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtUtils {
    private final String issuer;
    private final int expires;
    private final SecretKey jwtSecretKey;

    public JwtUtils(SecretKey jwtSecretKey,
            @Value("${com.group.project.jwt.issuer}") String issuer,
            @Value("${com.group.project.jwt.expires}") int expires) {
        this.jwtSecretKey = jwtSecretKey;
        this.issuer = issuer;
        this.expires = expires;
    }

    // 鍵でjwtを検証
    public Claims getPayload(String jwt, SecretKey secretKey) {
        Objects.requireNonNull(secretKey, "Secret key must not be null");
        try {
            if (Objects.isNull(jwt)) {
                throw new IllegalArgumentException("Authentication token is missing.");
            }

            return Jwts.parser()
                    .verifyWith(secretKey)
                    .clockSkewSeconds(10)
                    .build()
                    .parseSignedClaims(jwt)
                    .getPayload();
        } catch (SignatureException e) {
            throw new IllegalArgumentException("Authentication token is invalid.", e);
        } catch (ExpiredJwtException e) {
            throw new IllegalArgumentException("Authentication token has expired.", e);
        }
    }

    // jwt本体を生成
    public String generateToken(String subject, String audience) {
        validateInputs(subject, audience, jwtSecretKey);

        Date issuedAt = new Date();
        Date expiration = new Date(issuedAt.getTime() + expires * 1000L);

        log.debug("Generating JWT token for subject: {}, audience: {}, issuedAt: {}, expiresIn: {} seconds",
                subject, audience, issuedAt, expires);

        return Jwts.builder()
                .subject(subject)
                .setIssuer(issuer)
                .id(UUID.randomUUID().toString())
                .audience()
                .add(audience)
                .and()
                .issuedAt(issuedAt)
                .notBefore(issuedAt)
                .expiration(expiration)
                .signWith(SignatureAlgorithm.HS256, jwtSecretKey)
                .compact();
    }

    // jwtの著名、検証に用いる鍵を生成
    public SecretKey generateSecretKey(String signingKey) {
        if (Objects.isNull(signingKey) || signingKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Authentication signing key is missing.");
        }
        // このバイト列はこのアルゴリズム用の秘密鍵であることを明示する
        return Keys.hmacShaKeyFor(signingKey.getBytes(StandardCharsets.UTF_8));
    }

    // jwtの検証
    private void validateInputs(String subject, String audience, SecretKey secretKey) {
        Objects.requireNonNull(subject, "Token subject must not be null");
        Objects.requireNonNull(audience, "Token audience must not be null");
        Objects.requireNonNull(secretKey, "Secret key must not be null");
    }
}