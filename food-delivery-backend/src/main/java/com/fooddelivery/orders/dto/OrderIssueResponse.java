package com.fooddelivery.orders.dto;

import com.fooddelivery.orders.entity.OrderIssueCategory;
import com.fooddelivery.orders.entity.OrderIssueStatus;

import java.time.LocalDateTime;

public class OrderIssueResponse {

    private String id;
    private String orderId;
    private String orderNumber;
    private String restaurantId;
    private String reportedByUserId;
    private String reportedByRole;
    private String reportedByName;
    private OrderIssueCategory category;
    private String description;
    private OrderIssueStatus status;
    private String resolutionNotes;
    private String resolvedByUserId;
    private String resolvedByName;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OrderIssueResponse() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(String restaurantId) {
        this.restaurantId = restaurantId;
    }

    public String getReportedByUserId() {
        return reportedByUserId;
    }

    public void setReportedByUserId(String reportedByUserId) {
        this.reportedByUserId = reportedByUserId;
    }

    public String getReportedByRole() {
        return reportedByRole;
    }

    public void setReportedByRole(String reportedByRole) {
        this.reportedByRole = reportedByRole;
    }

    public String getReportedByName() {
        return reportedByName;
    }

    public void setReportedByName(String reportedByName) {
        this.reportedByName = reportedByName;
    }

    public OrderIssueCategory getCategory() {
        return category;
    }

    public void setCategory(OrderIssueCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public OrderIssueStatus getStatus() {
        return status;
    }

    public void setStatus(OrderIssueStatus status) {
        this.status = status;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getResolvedByUserId() {
        return resolvedByUserId;
    }

    public void setResolvedByUserId(String resolvedByUserId) {
        this.resolvedByUserId = resolvedByUserId;
    }

    public String getResolvedByName() {
        return resolvedByName;
    }

    public void setResolvedByName(String resolvedByName) {
        this.resolvedByName = resolvedByName;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
