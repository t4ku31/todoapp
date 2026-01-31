package io.reflectoring.bff.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;

public class CategoryDto {

        @JsonIgnoreProperties(ignoreUnknown = true)
        @Schema(name = "CategoryResponse")
        public record Response(
                        @Schema(description = "Category ID", example = "1") Long id,
                        @Schema(description = "Category name", example = "Work") String name,
                        @Schema(description = "Category color", example = "#FF0000") String color) {
        }

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(name = "CategoryRequest")
        public record Request(
                        @Schema(description = "Category name", example = "Work") String name,
                        @Schema(description = "Category color", example = "#FF0000") String color) {
        }

        public record Entity(
                        Long id,
                        String userId,
                        String name,
                        String color) {
        }
}
