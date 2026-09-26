package com.fooddelivery.restaurants.repository;

import com.fooddelivery.restaurants.entity.MenuItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends MongoRepository<MenuItem, String> {

    List<MenuItem> findByRestaurantId(String restaurantId);

    List<MenuItem> findByRestaurantIdAndIsAvailableTrue(String restaurantId);

    Optional<MenuItem> findByIdAndRestaurantId(String id, String restaurantId);

    long countByRestaurantId(String restaurantId);
}
