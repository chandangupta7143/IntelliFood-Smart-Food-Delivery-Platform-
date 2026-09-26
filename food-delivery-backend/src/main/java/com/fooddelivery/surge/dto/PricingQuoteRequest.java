package com.fooddelivery.surge.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class PricingQuoteRequest {

    @NotNull(message = "cartId is mandatory")
    private String cartId;

    @NotNull(message = "restaurantId is mandatory")
    private String restaurantId;

    @NotNull(message = "deliveryLatitude is mandatory")
    @DecimalMin(value = "-90.0", message = "deliveryLatitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "deliveryLatitude must be between -90 and 90")
    private Double deliveryLatitude;

    @NotNull(message = "deliveryLongitude is mandatory")
    @DecimalMin(value = "-180.0", message = "deliveryLongitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "deliveryLongitude must be between -180 and 180")
    private Double deliveryLongitude;

    // Getters and Setters

    public String getCartId() {
        return cartId;
    }

    public void setCartId(String cartId) {
        this.cartId = cartId;
    }

    public String getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(String restaurantId) {
        this.restaurantId = restaurantId;
    }

    public Double getDeliveryLatitude() {
        return deliveryLatitude;
    }

    public void setDeliveryLatitude(Double deliveryLatitude) {
        this.deliveryLatitude = deliveryLatitude;
    }

    public Double getDeliveryLongitude() {
        return deliveryLongitude;
    }

    public void setDeliveryLongitude(Double deliveryLongitude) {
        this.deliveryLongitude = deliveryLongitude;
    }
}
