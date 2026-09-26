package com.fooddelivery.restaurants.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class RestaurantOwnerRegisterRequest {

    // Owner info
    @NotBlank(message = "Owner name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10,15}$", message = "Phone must be 10-15 digits")
    private String phone;

    // Restaurant info
    @NotBlank(message = "Restaurant name is required")
    @Size(min = 2, max = 100, message = "Restaurant name must be between 2 and 100 characters")
    private String restaurantName;

    private String description;

    @NotEmpty(message = "At least one cuisine is required")
    private List<String> cuisines;

    @NotBlank(message = "Address is required")
    private String address;

    private String cityName = "Pune";
    private String cityCode = "PNQ";

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    private double latitude = 18.5204;

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    private double longitude = 73.8567;

    @Min(value = 1, message = "Price range must be between 1 and 4")
    @Max(value = 4, message = "Price range must be between 1 and 4")
    private int priceRange = 2;

    private int averageDeliveryTimeMinutes = 30;
    private double minimumOrderAmount = 100.0;
    private boolean isVegetarian = false;

    public RestaurantOwnerRegisterRequest() {
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getCuisines() { return cuisines; }
    public void setCuisines(List<String> cuisines) { this.cuisines = cuisines; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }

    public String getCityCode() { return cityCode; }
    public void setCityCode(String cityCode) { this.cityCode = cityCode; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public int getPriceRange() { return priceRange; }
    public void setPriceRange(int priceRange) { this.priceRange = priceRange; }

    public int getAverageDeliveryTimeMinutes() { return averageDeliveryTimeMinutes; }
    public void setAverageDeliveryTimeMinutes(int averageDeliveryTimeMinutes) { this.averageDeliveryTimeMinutes = averageDeliveryTimeMinutes; }

    public double getMinimumOrderAmount() { return minimumOrderAmount; }
    public void setMinimumOrderAmount(double minimumOrderAmount) { this.minimumOrderAmount = minimumOrderAmount; }

    public boolean isVegetarian() { return isVegetarian; }
    public void setVegetarian(boolean vegetarian) { isVegetarian = vegetarian; }
}
