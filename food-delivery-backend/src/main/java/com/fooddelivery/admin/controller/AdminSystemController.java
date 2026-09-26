package com.fooddelivery.admin.controller;

import com.fooddelivery.common.response.ApiResponse;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/system")
public class AdminSystemController {

    private final MongoTemplate mongoTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    public AdminSystemController(MongoTemplate mongoTemplate, RedisTemplate<String, Object> redisTemplate) {
        this.mongoTemplate = mongoTemplate;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();

        status.put("backendStatus", "UP");
        status.put("jvmUptimeSeconds", ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
        status.put("jvmThreadCount", Thread.activeCount());

        long memoryUsedMb = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / (1024 * 1024);
        long memoryMaxMb = Runtime.getRuntime().maxMemory() / (1024 * 1024);
        status.put("jvmMemoryUsedMb", memoryUsedMb);
        status.put("jvmMemoryMaxMb", memoryMaxMb);

        boolean mongoOk;
        try {
            mongoOk = mongoTemplate.getDb() != null;
        } catch (Exception e) {
            mongoOk = false;
        }
        status.put("mongodbConnected", mongoOk);

        boolean redisOk;
        try {
            redisOk = "PONG".equalsIgnoreCase(redisTemplate.getConnectionFactory().getConnection().ping());
        } catch (Exception e) {
            redisOk = false;
        }
        status.put("redisConnected", redisOk);

        return ResponseEntity.ok(ApiResponse.success("System status retrieved successfully", status));
    }
}
