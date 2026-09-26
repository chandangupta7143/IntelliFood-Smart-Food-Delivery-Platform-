package com.fooddelivery.admin.dto;

public class DashboardStatsResponse {

    private long totalOrders;
    private long activeOrders;
    private long pendingReviewOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private double totalRevenue;

    private long totalDrivers;
    private long onlineDrivers;
    private long busyDrivers;

    private long totalRestaurants;
    private long activeRestaurants;

    private long fraudQueueCount;
    private boolean surgeEmergencyDisabled;

    public DashboardStatsResponse() {
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getActiveOrders() {
        return activeOrders;
    }

    public void setActiveOrders(long activeOrders) {
        this.activeOrders = activeOrders;
    }

    public long getPendingReviewOrders() {
        return pendingReviewOrders;
    }

    public void setPendingReviewOrders(long pendingReviewOrders) {
        this.pendingReviewOrders = pendingReviewOrders;
    }

    public long getDeliveredOrders() {
        return deliveredOrders;
    }

    public void setDeliveredOrders(long deliveredOrders) {
        this.deliveredOrders = deliveredOrders;
    }

    public long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(long cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getTotalDrivers() {
        return totalDrivers;
    }

    public void setTotalDrivers(long totalDrivers) {
        this.totalDrivers = totalDrivers;
    }

    public long getOnlineDrivers() {
        return onlineDrivers;
    }

    public void setOnlineDrivers(long onlineDrivers) {
        this.onlineDrivers = onlineDrivers;
    }

    public long getBusyDrivers() {
        return busyDrivers;
    }

    public void setBusyDrivers(long busyDrivers) {
        this.busyDrivers = busyDrivers;
    }

    public long getTotalRestaurants() {
        return totalRestaurants;
    }

    public void setTotalRestaurants(long totalRestaurants) {
        this.totalRestaurants = totalRestaurants;
    }

    public long getActiveRestaurants() {
        return activeRestaurants;
    }

    public void setActiveRestaurants(long activeRestaurants) {
        this.activeRestaurants = activeRestaurants;
    }

    public long getFraudQueueCount() {
        return fraudQueueCount;
    }

    public void setFraudQueueCount(long fraudQueueCount) {
        this.fraudQueueCount = fraudQueueCount;
    }

    public boolean isSurgeEmergencyDisabled() {
        return surgeEmergencyDisabled;
    }

    public void setSurgeEmergencyDisabled(boolean surgeEmergencyDisabled) {
        this.surgeEmergencyDisabled = surgeEmergencyDisabled;
    }
}
