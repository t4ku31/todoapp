package io.reflectoring.bff.controller;

import java.security.Principal;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.client.RestClient;

import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/debug")
public class ResourceController {

    private static final Logger log = LoggerFactory.getLogger(ResourceController.class);
    private final RestClient restClient;

    public ResourceController(RestClient restClient) {
        log.info("ResourceController initialized");
        this.restClient = restClient;
    }

    @GetMapping("/resource")
    @ResponseBody
    public String getResource(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient authorizedClient,
            @AuthenticationPrincipal(expression = "name") String username) {

        log.info("[/debug/resource] Request started for user: {}", username);

        // Resource Server のエンドポイント (Docker内部ネットワーク)
        String resourceUri = "http://resource-server:8080/hello";

        String tokenValue = authorizedClient.getAccessToken().getTokenValue();
        log.debug("[/debug/resource] Access token present: {}", Objects.nonNull(tokenValue));

        if (Objects.nonNull(tokenValue)) {
            log.info("[/debug/resource] Calling Resource Server at: {}", resourceUri);
            try {
                ResponseEntity<String> result = restClient.get()
                        .uri(resourceUri)
                        .headers(
                                h -> h.setBearerAuth(tokenValue))
                        .accept(MediaType.APPLICATION_JSON)
                        .retrieve()
                        .toEntity(String.class);

                log.info("[/debug/resource] Resource Server responded with status: {}", result.getStatusCode());
                String response = "Hello, " + username + "! Resource says: " + result.getBody();
                log.info("[/debug/resource] Request completed successfully");
                return response;
            } catch (Exception e) {
                log.error("[/debug/resource] Error calling Resource Server: {}", e.getMessage(), e);
                return "Hello, " + username + "! Resource says: Error - " + e.getMessage();
            }
        }

        log.warn("[/debug/resource] No access token available for user: {}", username);
        return "Hello, " + username + "! Resource says: " + "No access token";
    }

    @GetMapping("/me")
    @ResponseBody
    public Map<String, Object> getCurrentUser(HttpServletRequest request) {
        log.info("[/debug/me] Request started");

        if (Objects.nonNull(request.getUserPrincipal())) {
            Principal principal = request.getUserPrincipal();
            String username = principal.getName();
            log.debug("[/debug/me] principal: {}", principal);
            log.info("[/debug/me] User found: {}", username);
            log.info("[/debug/me] Request completed successfully");
            return Map.of(
                    "username", username,
                    "authenticated", true);
        }

        log.warn("[/debug/me] No user principal found");
        return Map.of(
                "error", "No user principal found",
                "authenticated", false);
    }

    @GetMapping("/token")
    @ResponseBody
    public Map<String, Object> getAccessToken(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient authorizedClient) {

        log.info("[/debug/token] Request started");

        if (Objects.isNull(authorizedClient) || Objects.isNull(authorizedClient.getAccessToken())) {
            log.warn("[/debug/token] No authorized client or access token available");
            return Map.of("error", "No access token available");
        }

        String tokenValue = authorizedClient.getAccessToken().getTokenValue();
        if (Objects.isNull(tokenValue)) {
            log.warn("[/debug/token] Access token value is null");
            return Map.of("error", "Access token value is null");
        }

        var expiresAt = authorizedClient.getAccessToken().getExpiresAt();
        var scopes = authorizedClient.getAccessToken().getScopes();

        log.info("[/debug/token] Token info - expires_at: {}, scopes: {}", expiresAt, scopes);
        log.debug("[/debug/token] Token value (first 20 chars): {}...",
                tokenValue.length() > 20 ? tokenValue.substring(0, 20) : tokenValue);
        log.info("[/debug/token] Request completed successfully");

        return Map.of(
                "access_token", tokenValue,
                "expires_at", Objects.nonNull(expiresAt) ? expiresAt.toString() : "N/A",
                "scopes", Objects.nonNull(scopes) ? scopes : "N/A");
    }

}
