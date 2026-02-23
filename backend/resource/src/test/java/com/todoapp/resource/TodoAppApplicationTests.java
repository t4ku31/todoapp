package com.todoapp.resource;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class TodoAppApplicationTests {

	@org.springframework.boot.test.mock.mockito.MockBean
	org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
