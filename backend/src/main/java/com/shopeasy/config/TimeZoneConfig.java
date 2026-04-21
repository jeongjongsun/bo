package com.shopeasy.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * 시스템 기본 타임존을 한국(Asia/Seoul, UTC+9)으로 고정.
 * DB 저장·조회, Java Date/Instant, SQL CURRENT_TIMESTAMP 등이 모두 한국 시간 기준으로 동작하도록 한다.
 */
@Configuration
public class TimeZoneConfig {

    public static final String DEFAULT_ZONE_ID = "Asia/Seoul";

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone(DEFAULT_ZONE_ID));
    }
}
