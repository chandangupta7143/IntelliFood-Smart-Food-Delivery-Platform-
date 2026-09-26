package com.fooddelivery.orders.entity;

/**
 * Standard issue categories for order support & delivery escalations.
 */
public enum OrderIssueCategory {
    RESTAURANT_UNAVAILABLE,
    CUSTOMER_UNAVAILABLE,
    WRONG_ADDRESS,
    VEHICLE_ISSUE,
    FOOD_QUALITY,
    ORDER_DELAYED,
    SAFETY_CONCERN,
    OTHER
}
