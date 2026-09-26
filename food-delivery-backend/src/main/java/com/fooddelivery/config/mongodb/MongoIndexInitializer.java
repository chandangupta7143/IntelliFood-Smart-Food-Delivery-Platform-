package com.fooddelivery.config.mongodb;

import com.fooddelivery.restaurants.entity.MenuItem;
import com.fooddelivery.restaurants.entity.Restaurant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

/**
 * Ensures critical MongoDB indexes exist at application startup in an idempotent manner.
 * Compatible with auto-index-creation=false for production safety.
 */
@Component
public class MongoIndexInitializer {

    private static final Logger log = LoggerFactory.getLogger(MongoIndexInitializer.class);

    private final MongoTemplate mongoTemplate;

    public MongoIndexInitializer(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initIndexes() {
        try {
            log.info("Verifying and initializing MongoDB indexes...");

            // 1. restaurants.ownerId
            mongoTemplate.indexOps(Restaurant.class)
                    .ensureIndex(new Index().on("ownerId", Sort.Direction.ASC).named("idx_restaurants_owner_id"));

            // 2. menu_items: { restaurantId: 1, isAvailable: 1 }
            mongoTemplate.indexOps(MenuItem.class)
                    .ensureIndex(new Index()
                            .on("restaurantId", Sort.Direction.ASC)
                            .on("isAvailable", Sort.Direction.ASC)
                            .named("idx_menu_restaurant_available"));

            // 3. menu_items: { restaurantId: 1, category: 1 }
            mongoTemplate.indexOps(MenuItem.class)
                    .ensureIndex(new Index()
                            .on("restaurantId", Sort.Direction.ASC)
                            .on("category", Sort.Direction.ASC)
                            .named("idx_menu_restaurant_category"));

            log.info("MongoDB index verification complete.");
        } catch (Exception e) {
            log.warn("Non-fatal: MongoDB index verification encountered an issue: {}", e.getMessage());
        }
    }
}
