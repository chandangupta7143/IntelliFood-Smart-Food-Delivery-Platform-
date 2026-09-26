package com.fooddelivery.orders.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Persisted issue ticket representing an operational escalation or support request
 * during the order lifecycle.
 */
@Document(collection = "order_issues")
@CompoundIndexes({
        @CompoundIndex(name = "idx_issue_order_created", def = "{'orderId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_issue_status_created", def = "{'status': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "idx_issue_restaurant_status", def = "{'restaurantId': 1, 'status': 1}")
})
public class OrderIssue {

    @Id
    private String id;

    @Indexed
    private String orderId;

    private String orderNumber;

    @Indexed
    private String restaurantId;

    @Indexed
    private String reportedByUserId;
    private String reportedByRole;
    private String reportedByName;

    private OrderIssueCategory category;
    private String description;

    @Indexed
    private OrderIssueStatus status = OrderIssueStatus.OPEN;

    private String resolutionNotes;
    private String resolvedByUserId;
    private String resolvedByName;
    private LocalDateTime resolvedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public OrderIssue() {
        this.status = OrderIssueStatus.OPEN;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public OrderIssue(String orderId, String orderNumber, String restaurantId,
                      String reportedByUserId, String reportedByRole, String reportedByName,
                      OrderIssueCategory category, String description) {
        this();
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.restaurantId = restaurantId;
        this.reportedByUserId = reportedByUserId;
        this.reportedByRole = reportedByRole;
        this.reportedByName = reportedByName;
        this.category = category;
        this.description = description;
    }

    // Getters and Setters

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
