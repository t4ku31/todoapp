package io.reflectoring.bff.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.JdbcOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProvider;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.AuthenticatedPrincipalOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class OAuth2LoginSecurityConfig {
        private final UrlBasedCorsConfigurationSource corsConfigurationSource;

        @Value("${app.front-server-url}")
        private String frontServerUrl;

        @Value("${app.base-url}")
        private String appBaseUrl;

        @Autowired
        public OAuth2LoginSecurityConfig(UrlBasedCorsConfigurationSource corsConfigurationSource) {
                this.corsConfigurationSource = corsConfigurationSource;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http,
                        ClientRegistrationRepository clientRegistrationRepository) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                                .authorizeHttpRequests(authorize -> authorize
                                                // Permit OAuth2 login endpoints
                                                .requestMatchers("/oauth2/**", "/login/**").permitAll()
                                                // Permit actuator health endpoint for monitoring
                                                .requestMatchers("/actuator/health").permitAll()
                                                // Permit Swagger UI and API Docs
                                                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**",
                                                                "/swagger-ui.html")
                                                .permitAll()
                                                // All other requests require authentication
                                                .anyRequest().authenticated())
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(
                                                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                                .csrf(csrf -> csrf.disable()) // Disable CSRF for simplicity
                                .oauth2Login(oauth2 -> oauth2
                                                .defaultSuccessUrl(frontServerUrl + "/todo", true));

                http.logout(logout -> logout
                                .logoutSuccessHandler(oidcLogoutSuccessHandler(clientRegistrationRepository)));

                return http.build();
        }

        @Bean
        public HttpSessionEventPublisher sessionEventPublisher() {
                return new HttpSessionEventPublisher();
        }

        @Bean
        public OAuth2AuthorizedClientService authorizedClientService(JdbcOperations jdbcOperations,
                        ClientRegistrationRepository clientRegistrationRepository) {
                return new JdbcOAuth2AuthorizedClientService(jdbcOperations, clientRegistrationRepository);
        }

        @Bean
        public OAuth2AuthorizedClientRepository authorizedClientRepository(
                        OAuth2AuthorizedClientService authorizedClientService) {
                return new AuthenticatedPrincipalOAuth2AuthorizedClientRepository(authorizedClientService);
        }

        private LogoutSuccessHandler oidcLogoutSuccessHandler(
                        ClientRegistrationRepository clientRegistrationRepository) {
                OidcClientInitiatedLogoutSuccessHandler oidcLogoutSuccessHandler = new OidcClientInitiatedLogoutSuccessHandler(
                                clientRegistrationRepository);

                // Set the location that the End-User's User Agent will be redirected to
                // after the logout has been performed at the Provider
                oidcLogoutSuccessHandler.setPostLogoutRedirectUri(frontServerUrl + "/auth");

                return oidcLogoutSuccessHandler;
        }

        @Bean
        public OAuth2AuthorizedClientManager authorizedClientManager(
                        ClientRegistrationRepository clientRegistrationRepository,
                        OAuth2AuthorizedClientRepository authorizedClientRepository) {
                OAuth2AuthorizedClientProvider authorizedClientProvider = OAuth2AuthorizedClientProviderBuilder
                                .builder()
                                .authorizationCode()
                                .refreshToken()
                                .clientCredentials()
                                .build();

                DefaultOAuth2AuthorizedClientManager authorizedClientManager = new DefaultOAuth2AuthorizedClientManager(
                                clientRegistrationRepository, authorizedClientRepository);
                authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

                return authorizedClientManager;
        }
}
