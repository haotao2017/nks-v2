package no.nks.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * 缓存配置类，提供缓存相关的配置和键生成器
 *
 * 现代化说明：旧后端 pom 引入了 Caffeine，但实际使用的是 Spring 内置的
 * {@code ConcurrentMapCacheManager}（无 TTL、无容量上限）。此处改为真正的
 * {@link CaffeineCacheManager}，设置 expireAfterWrite 与 maximumSize，
 * 同时保留旧代码预声明的全部缓存名称。
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 配置缓存管理器
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        // 使用 Caffeine 作为底层缓存实现：写入后 30 分钟过期，单个缓存最多 1000 条
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .maximumSize(1000));
        // Specify the cache names that will be used in the application
        // This pre-creates them (disables dynamic cache creation), matching the
        // old ConcurrentMapCacheManager behavior of pre-declaring exactly these names.
        cacheManager.setCacheNames(Arrays.asList(
                "partyDocs",
                "partyDocCounts",
                "partyUploadedFiles",
                "checklistTemplate",
                "checklistTemplateList",
                "checklistItemInspectionData",
                "projectCache",
                "projectCountsCache",
                "projectLeaderCache",
                "projectChecklists",
                "projectChecklistsCache", // 添加缺失的缓存名称
                "projectChecklist",
                "checklistItems",
                "projectPartyCache",
                "inspectorsNewFormatCache"
        ));
        return cacheManager;
    }
}
