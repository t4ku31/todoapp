package io.reflectoring.bff.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.reflectoring.bff.config.AppProperties;
import io.reflectoring.bff.dto.CategoryDto;

@Service
public class BffCategoryService {

    private static final Logger log = LoggerFactory.getLogger(BffCategoryService.class);
    private final RestClient restClient;
    private final String resourceUrl;

    public BffCategoryService(RestClient.Builder builder, AppProperties appProperties) {
        this.restClient = builder.baseUrl(appProperties.getResourceServerUrl()).build();
        this.resourceUrl = appProperties.getResourceServerUrl() + "/api";
    }

    public List<CategoryDto.Response> getAllCategories(String token) {
        log.info("Fetching all categories from Resource Server");
        List<CategoryDto.Response> categories = restClient.get()
                .uri(resourceUrl + "/categories")
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<CategoryDto.Response>>() {
                });

        if (categories == null) {
            return List.of();
        }

        log.info("Successfully fetched {} categories", categories.size());
        return categories;
    }

    public CategoryDto.Response createCategory(String token, CategoryDto.Request category) {
        log.info("Creating category in Resource Server");
        CategoryDto.Response createdCategory = restClient.post()
                .uri(resourceUrl + "/categories")
                .header("Authorization", "Bearer " + token)
                .body(category)
                .retrieve()
                .body(CategoryDto.Response.class);

        log.info("Successfully created category with id: {}", createdCategory.id());
        return createdCategory;
    }

    public void updateCategory(String token, Long id, CategoryDto.Request category) {
        log.info("Updating category id: {} in Resource Server", id);
        restClient.patch()
                .uri(resourceUrl + "/categories/" + id)
                .header("Authorization", "Bearer " + token)
                .body(category)
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully updated category id: {}", id);
    }

    public void deleteCategory(String token, Long id) {
        log.info("Deleting category id: {} in Resource Server", id);
        restClient.delete()
                .uri(resourceUrl + "/categories/" + id)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .toBodilessEntity();
        log.info("Successfully deleted category id: {}", id);
    }
}
