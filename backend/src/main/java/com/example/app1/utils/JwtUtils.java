package com.example.app1.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Objects;
import java.util.UUID;

import javax.crypto.SecretKey;

import lombok.extern.slf4j.Slf4j;
import java.util.logging.Logger;

@Slf4j
@Component
public class JwtUtils {
    private final String issuer;
    private final int expires;
    private final SecretKey jwtSecretKey;
    private static final Logger logger = Logger.getLogger(JwtUtils.class.getName());

    public JwtUtils(SecretKey jwtSecretKey,
            @Value("${com.group.project.jwt.issuer}") String issuer,
            @Value("${com.group.project.jwt.expires}") int expires) {
        this.jwtSecretKey = jwtSecretKey;
        this.issuer = issuer;
        this.expires = expires;
        log.debug("secretKey from configuration" + jwtSecretKey);
    }

    // 鍵でjwtを検証
    public Claims getPayload(String jwt, SecretKey secretKey) {
        Objects.requireNonNull(secretKey, "Secret key must not be null");
        try {
            if (Objects.isNull(jwt)) {
                throw new IllegalArgumentException("Authentication token is missing.");
            }

            return Jwts.parser()
                    .setSigningKey(secretKey)  // verifyWith の代わりに setSigningKey を使用
                    .setAllowedClockSkewSeconds(10)  // clockSkewSeconds の代わりに setAllowedClockSkewSeconds を使用
                    .parseClaimsJws(jwt)       // parseSignedClaims の代わりに parseClaimsJws を使用
                    .getBody();                // getPayload の代わりに getBody を使用
            
        } catch (io.jsonwebtoken.SignatureException e) {
            throw new IllegalArgumentException("Authentication token is invalid.", e);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new IllegalArgumentException("Authentication token has expired.", e);
        }
    }

    // jwt本体を生成
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expires * 1000L);
        
        log.debug("Generating JWT token for subject: {}, issuedAt: {}, expiresIn: {} seconds",
                email, now, expires);
        logger.fine("secretkey" + jwtSecretKey);
        return Jwts.builder()
                .setSubject(email)  // use setSubject instead of subject
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(jwtSecretKey, SignatureAlgorithm.HS512)
                .compact();
    }

    // jwtの著名、検証に用いる鍵を生成
    public SecretKey generateSecretKey(String signingKey) {
        if (Objects.isNull(signingKey) || signingKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Authentication signing key is missing.");
        }
        // このバイト列はこのアルゴリズム用の秘密鍵であることを明示する
        return io.jsonwebtoken.security.Keys.hmacShaKeyFor(signingKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    // jwtの検証
    private void validateInputs(String subject, SecretKey secretKey) {
        Objects.requireNonNull(subject, "Token subject must not be null");
        Objects.requireNonNull(secretKey, "Secret key must not be null");
    }
}