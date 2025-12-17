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
}
