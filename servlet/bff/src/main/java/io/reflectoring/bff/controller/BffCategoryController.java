package io.reflectoring.bff.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;

import io.reflectoring.bff.dto.CategoryDto;
import io.reflectoring.bff.service.BffCategoryService;

@RestController
@RequestMapping("/api")
public class BffCategoryController {

    private static final Logger log = LoggerFactory.getLogger(BffCategoryController.class);
    private final BffCategoryService categoryService;

    public BffCategoryController(BffCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto.Response>> getAllCategories(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client) {
        log.info("[GET /api/categories] Request by user: {}", client.getPrincipalName());
        try {
            List<CategoryDto.Response> categories = categoryService
                    .getAllCategories(client.getAccessToken().getTokenValue());
            log.info("[GET /api/categories] Returning {} categories", categories.size());
            return ResponseEntity.ok(categories);
        } catch (RestClientResponseException e) {
            log.error("[GET /api/categories] Error fetching categories: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[GET /api/categories] Error fetching categories: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
