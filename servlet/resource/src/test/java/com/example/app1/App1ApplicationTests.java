package com.example.app1;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class App1ApplicationTests {

	@org.springframework.boot.test.mock.mockito.MockBean
	org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
