package io.reflectoring.bff.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class TokenExchangeController {

    private final OAuth2AuthorizedClientManager authorizedClientManager;

    @GetMapping("/exchange")
    public String index(Authentication authentication, HttpServletRequest request) {
        OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                .withClientRegistrationId("bff-client")
                .principal(authentication)
                .attribute(HttpServletRequest.class.getName(), request)
                .build();

        OAuth2AuthorizedClient authorizedClient = authorizedClientManager.authorize(authorizeRequest);
        OAuth2AccessToken accessToken = authorizedClient.getAccessToken();
        return accessToken.getTokenValue();
    }
}