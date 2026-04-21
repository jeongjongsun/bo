package com.shopeasy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
/** Spring Boot 진입점. API 서버 (REST + 세션 인증). */
@SpringBootApplication
public class ShopeasyApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopeasyApplication.class, args);
    }
}
