package com.fooddelivery.restaurants.dto;

import java.time.LocalDateTime;

public class MenuItemResponse {
    private String id;
    private String restaurantId;
    private String name;
    private String description;
    private double price;
    private String category;
    private String imageUrl;
    private boolean isAvailable;
    private boolean isVegetarian;
    private int preparationTimeMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MenuItemResponse() {
    }

    public MenuItemResponse(String id, String restaurantId, String name, String description, double price,
                            String category, String imageUrl, boolean isAvailable, boolean isVegetarian,
                            int preparationTimeMinutes, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.restaurantId = restaurantId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.imageUrl = imageUrl;
        this.isAvailable = isAvailable;
        this.isVegetarian = isVegetarian;
        this.preparationTimeMinutes = preparationTimeMinutes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRestaurantId() { return restaurantId; }
    public void setRestaurantId(String restaurantId) { this.restaurantId = restaurantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }

    public boolean isVegetarian() { return isVegetarian; }
    public void setVegetarian(boolean vegetarian) { isVegetarian = vegetarian; }

    public int getPreparationTimeMinutes() { return preparationTimeMinutes; }
    public void setPreparationTimeMinutes(int preparationTimeMinutes) { this.preparationTimeMinutes = preparationTimeMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
