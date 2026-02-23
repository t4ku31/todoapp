package io.reflectoring.bff;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

import io.reflectoring.bff.config.CorsConfig;
import io.reflectoring.bff.config.OAuth2LoginSecurityConfig;

@SpringBootTest
@ComponentScan(basePackages = "io.reflectoring.bff", excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
		OAuth2LoginSecurityConfig.class, CorsConfig.class }))
class BffApplicationTests {

	@Test
	void contextLoads() {
	}

}
