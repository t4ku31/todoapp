package io.reflectoring.bff.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/categories")
    public ResponseEntity<CategoryDto.Response> createCategory(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client,
            @RequestBody CategoryDto.Request category) {
        log.info("[POST /api/categories] Request by user: {}", client.getPrincipalName());
        try {
            CategoryDto.Response createdCategory = categoryService
                    .createCategory(client.getAccessToken().getTokenValue(), category);
            log.info("[POST /api/categories] Created category: {}", createdCategory.name());
            return ResponseEntity.ok(createdCategory);
        } catch (RestClientResponseException e) {
            log.error("[POST /api/categories] Error creating category: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(null);
        } catch (Exception e) {
            log.error("[POST /api/categories] Error creating category: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/categories/{id}")
    public ResponseEntity<Void> updateCategory(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client,
            @PathVariable Long id,
            @RequestBody CategoryDto.Request category) {
        log.info("[PATCH /api/categories/{}] Request by user: {}", id, client.getPrincipalName());
        try {
            categoryService.updateCategory(client.getAccessToken().getTokenValue(), id, category);
            log.info("[PATCH /api/categories/{}] Updated category", id);
            return ResponseEntity.ok().build();
        } catch (RestClientResponseException e) {
            log.error("[PATCH /api/categories/{}] Error updating category: {}", id, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.error("[PATCH /api/categories/{}] Error updating category: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(
            @RegisteredOAuth2AuthorizedClient("bff-client") OAuth2AuthorizedClient client,
            @PathVariable Long id) {
        log.info("[DELETE /api/categories/{}] Request by user: {}", id, client.getPrincipalName());
        try {
            categoryService.deleteCategory(client.getAccessToken().getTokenValue(), id);
            log.info("[DELETE /api/categories/{}] Deleted category", id);
            return ResponseEntity.noContent().build();
        } catch (RestClientResponseException e) {
            log.error("[DELETE /api/categories/{}] Error deleting category: {}", id, e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.error("[DELETE /api/categories/{}] Error deleting category: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
