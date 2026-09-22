package com.taskmanager.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@Component
public class JwtTokenProvider {

    /** Claim holding the user's token version; bumping the version revokes older tokens. */
    static final String VERSION_CLAIM = "ver";

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 hours default
    private long jwtExpiration;

    private SecretKey signingKey;

    /** Refuse to start with a secret that's missing, a known placeholder, or too short for HS256. */
    @PostConstruct
    void checkSecret() {
        if (jwtSecret == null || jwtSecret.isBlank() || jwtSecret.contains("change-this")
                || jwtSecret.contains("your-secret")) {
            throw new IllegalStateException("JWT_SECRET is not set. Use a random value of at least 32 characters.");
        }
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes (256 bits) long.");
        }
        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email, int tokenVersion) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(email)
                .claim(VERSION_CLAIM, tokenVersion)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + jwtExpiration))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Parsed claims if the token is correctly signed, unexpired and has an expiry; otherwise empty. */
    public Optional<Claims> parse(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token) // rejects unsigned ("alg: none") and tampered tokens
                    .getBody();
            if (claims.getExpiration() == null || claims.getSubject() == null) return Optional.empty();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public static int versionOf(Claims claims) {
        Object v = claims.get(VERSION_CLAIM);
        return v instanceof Number n ? n.intValue() : 0;
    }
}
