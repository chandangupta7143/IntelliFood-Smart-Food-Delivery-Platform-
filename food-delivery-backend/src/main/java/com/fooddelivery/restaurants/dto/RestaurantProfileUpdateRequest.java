package com.fooddelivery.restaurants.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class RestaurantProfileUpdateRequest {

    @NotBlank(message = "Restaurant name is required")
    @Size(min = 2, max = 100)
    private String name;

    private String description;
    private List<String> cuisines;
    private String address;
    private String phone;
    private String email;

    @Min(1) @Max(4)
    private Integer priceRange;

    private Integer averageDeliveryTimeMinutes;
    private Double minimumOrderAmount;
    private Boolean isVegetarian;
    private Boolean isActive;

    public RestaurantProfileUpdateRequest() {
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getCuisines() { return cuisines; }
    public void setCuisines(List<String> cuisines) { this.cuisines = cuisines; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getPriceRange() { return priceRange; }
    public void setPriceRange(Integer priceRange) { this.priceRange = priceRange; }

    public Integer getAverageDeliveryTimeMinutes() { return averageDeliveryTimeMinutes; }
    public void setAverageDeliveryTimeMinutes(Integer averageDeliveryTimeMinutes) { this.averageDeliveryTimeMinutes = averageDeliveryTimeMinutes; }

    public Double getMinimumOrderAmount() { return minimumOrderAmount; }
    public void setMinimumOrderAmount(Double minimumOrderAmount) { this.minimumOrderAmount = minimumOrderAmount; }

    public Boolean getIsVegetarian() { return isVegetarian; }
    public void setIsVegetarian(Boolean vegetarian) { isVegetarian = vegetarian; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
