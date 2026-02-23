package com.todoapp.resource;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.todoapp.resource.config.AppConfigurationProperties;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.todoapp.resource.repository")
@EnableConfigurationProperties(AppConfigurationProperties.class)
public class TodoAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(TodoAppApplication.class, args);
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Tokyo"));
    }
}
