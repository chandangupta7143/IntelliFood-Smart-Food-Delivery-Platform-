package com.fooddelivery.restaurants.dto;

public class RestaurantDashboardStatsResponse {
    private String restaurantId;
    private String restaurantName;
    private boolean isOpen;
    private int totalOrders;
    private int pendingOrders;
    private int preparingOrders;
    private int readyOrders;
    private int completedOrders;
    private double totalRevenue;
    private int totalMenuItems;

    public RestaurantDashboardStatsResponse() {
    }

    public RestaurantDashboardStatsResponse(String restaurantId, String restaurantName, boolean isOpen,
                                           int totalOrders, int pendingOrders, int preparingOrders,
                                           int readyOrders, int completedOrders, double totalRevenue, int totalMenuItems) {
        this.restaurantId = restaurantId;
        this.restaurantName = restaurantName;
        this.isOpen = isOpen;
        this.totalOrders = totalOrders;
        this.pendingOrders = pendingOrders;
        this.preparingOrders = preparingOrders;
        this.readyOrders = readyOrders;
        this.completedOrders = completedOrders;
        this.totalRevenue = totalRevenue;
        this.totalMenuItems = totalMenuItems;
    }

    // Getters and Setters
    public String getRestaurantId() { return restaurantId; }
    public void setRestaurantId(String restaurantId) { this.restaurantId = restaurantId; }

    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }

    public boolean getIsOpen() { return isOpen; }
    public void setIsOpen(boolean isOpen) { this.isOpen = isOpen; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public int getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(int pendingOrders) { this.pendingOrders = pendingOrders; }

    public int getPreparingOrders() { return preparingOrders; }
    public void setPreparingOrders(int preparingOrders) { this.preparingOrders = preparingOrders; }

    public int getReadyOrders() { return readyOrders; }
    public void setReadyOrders(int readyOrders) { this.readyOrders = readyOrders; }

    public int getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(int completedOrders) { this.completedOrders = completedOrders; }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public int getTotalMenuItems() { return totalMenuItems; }
    public void setTotalMenuItems(int totalMenuItems) { this.totalMenuItems = totalMenuItems; }
}
