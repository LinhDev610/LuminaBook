package com.lumina_book.backend.configuration;

import java.text.ParseException;
import java.util.Objects;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import com.lumina_book.backend.dto.request.IntrospectRequest;
import com.lumina_book.backend.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CustomJwtDecoder implements JwtDecoder {
    @Value("${jwt.signerKey}")
    private String signerKey;

    @Autowired
    private AuthenticationService authenticationService;

    private volatile NimbusJwtDecoder nimbusJwtDecoder = null;

    @Override
    public Jwt decode(String token) throws JwtException {
        if (token == null || token.trim().isEmpty()) {
            log.warn("Attempted to decode null or empty token");
            throw new JwtException("Token is null or empty");
        }

        try {
            // Check token còn hiệu lực không, nếu không -> Exception
            var response = authenticationService.introspect(
                    IntrospectRequest.builder().token(token).build());

            if (!response.isValid()) {
                log.warn(
                        "Token validation failed: token is invalid (expired or malformed). Token prefix: {}",
                        token.length() > 20 ? token.substring(0, 20) + "..." : token);
                throw new JwtException("Token invalid");
            }
        } catch (JOSEException | ParseException e) {
            log.warn(
                    "Token parsing/verification failed: {}. Token prefix: {}",
                    e.getMessage(),
                    token.length() > 20 ? token.substring(0, 20) + "..." : token);
            throw new JwtException("Token invalid: " + e.getMessage());
        } catch (JwtException e) {
            // Re-throw JwtException as-is
            throw e;
        } catch (Exception e) {
            // Catch any other unexpected exceptions
            log.error(
                    "Unexpected error during token introspection: {}. Token prefix: {}",
                    e.getMessage(),
                    token.length() > 20 ? token.substring(0, 20) + "..." : token,
                    e);
            throw new JwtException("Token validation failed: " + e.getMessage());
        }

        // Nếu token còn hiệu lực
        try {
            // Thread-safe lazy initialization using double-checked locking pattern
            if (Objects.isNull(nimbusJwtDecoder)) {
                synchronized (this) {
                    // Double-check after acquiring lock
                    if (Objects.isNull(nimbusJwtDecoder)) {
                        SecretKeySpec secretKeySpec = new SecretKeySpec(getSignerKeyBytes(), "HS512");
                        nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                                .macAlgorithm(MacAlgorithm.HS512)
                                .build();
                    }
                }
            }

            return nimbusJwtDecoder.decode(token);
        } catch (Exception e) {
            log.error("Error decoding JWT token: {}", e.getMessage(), e);
            throw new JwtException("Token decode failed: " + e.getMessage());
        }
    }

    private byte[] getSignerKeyBytes() {
        String sanitized = (signerKey == null) ? "" : signerKey.replaceAll("\\s", ""); // xóa khoảng trắng
        return sanitized.getBytes();
    }
}
