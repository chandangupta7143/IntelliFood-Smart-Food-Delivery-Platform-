package com.fooddelivery.restaurants.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateMenuItemRequest {

    @NotBlank(message = "Item name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private String description;

    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private double price;

    @NotBlank(message = "Category is required")
    private String category;

    private String imageUrl;
    private Boolean isAvailable;
    private Boolean isVegetarian;
    private Integer preparationTimeMinutes;

    public UpdateMenuItemRequest() {
    }

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

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean available) { isAvailable = available; }

    public Boolean getIsVegetarian() { return isVegetarian; }
    public void setIsVegetarian(Boolean vegetarian) { isVegetarian = vegetarian; }

    public Integer getPreparationTimeMinutes() { return preparationTimeMinutes; }
    public void setPreparationTimeMinutes(Integer preparationTimeMinutes) { this.preparationTimeMinutes = preparationTimeMinutes; }
}
