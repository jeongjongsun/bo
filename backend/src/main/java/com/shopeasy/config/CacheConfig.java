package com.shopeasy.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.lang.NonNull;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 공통코드 등 자주 조회·드물게 변경되는 데이터용 메모리 캐시 (Caffeine).
 * codeList: main_cd+lang 별 1시간 유지.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_CODE_LIST = "codeList";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(CACHE_CODE_LIST);
        manager.setCaffeine(createDefaultCaffeine());
        return manager;
    }

    @NonNull
    @SuppressWarnings("null")
    private static Caffeine<Object, Object> createDefaultCaffeine() {
        return Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .maximumSize(500);
    }
}
