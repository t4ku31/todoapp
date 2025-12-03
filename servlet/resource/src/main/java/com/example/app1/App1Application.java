package com.example.app1;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import com.example.app1.config.AppConfigurationProperties;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.example.app1.repository")
@EnableConfigurationProperties(AppConfigurationProperties.class)
public class App1Application {
    public static void main(String[] args) {
        SpringApplication.run(App1Application.class, args);
    }
}
