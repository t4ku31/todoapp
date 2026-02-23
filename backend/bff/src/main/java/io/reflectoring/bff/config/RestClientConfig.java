package io.reflectoring.bff.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.OAuth2AuthorizationFailureHandler;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.client.OAuth2ClientHttpRequestInterceptor;
import org.springframework.security.oauth2.client.web.client.RequestAttributePrincipalResolver;
import org.springframework.web.client.RestClient;

// This RestClient automatically attaches OAuth2 access tokens
// for outbound requests using the provided AuthorizedClientManager.
@Configuration
public class RestClientConfig {

        @Bean
        public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager,
                        OAuth2AuthorizedClientRepository authorizedClientRepository) {

                // Set up an OAuth2ClientHttpRequestInterceptor to handle OAuth2 authorization
                OAuth2ClientHttpRequestInterceptor requestInterceptor = new OAuth2ClientHttpRequestInterceptor(
                                authorizedClientManager);
                requestInterceptor.setPrincipalResolver(new RequestAttributePrincipalResolver());

                // Set up an authorization failure handler to manage token refreshes and
                // re-authorizations
                OAuth2AuthorizationFailureHandler authorizationFailureHandler = OAuth2ClientHttpRequestInterceptor
                                .authorizationFailureHandler(authorizedClientRepository);
                requestInterceptor.setAuthorizationFailureHandler(authorizationFailureHandler);

                return RestClient.builder().requestInterceptor(requestInterceptor).build();
        }

}