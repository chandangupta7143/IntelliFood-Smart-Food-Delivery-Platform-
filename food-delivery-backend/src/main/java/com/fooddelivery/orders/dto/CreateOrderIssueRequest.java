package com.fooddelivery.orders.dto;

import com.fooddelivery.orders.entity.OrderIssueCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateOrderIssueRequest {

    @NotNull(message = "Issue category is required")
    private OrderIssueCategory category;

    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 1000, message = "Description must be between 5 and 1000 characters")
    private String description;

    public CreateOrderIssueRequest() {
    }

    public CreateOrderIssueRequest(OrderIssueCategory category, String description) {
        this.category = category;
        this.description = description;
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
}
