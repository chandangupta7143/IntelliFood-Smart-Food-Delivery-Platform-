package com.fooddelivery.restaurants.repository;

import com.fooddelivery.restaurants.entity.Restaurant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends MongoRepository<Restaurant, String> {
    long countByIsActiveTrueAndIsDeletedFalse();
    Optional<Restaurant> findByOwnerId(String ownerId);
    List<Restaurant> findAllByOwnerId(String ownerId);
}
