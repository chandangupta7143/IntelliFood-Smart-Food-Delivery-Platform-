package com.fooddelivery.orders.dto;

import com.fooddelivery.orders.entity.OrderIssueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ResolveOrderIssueRequest {

    @NotNull(message = "Resolution status is required")
    private OrderIssueStatus status;

    @NotBlank(message = "Resolution notes are required")
    @Size(min = 5, max = 1000, message = "Resolution notes must be between 5 and 1000 characters")
    private String resolutionNotes;

    public ResolveOrderIssueRequest() {
    }

    public ResolveOrderIssueRequest(OrderIssueStatus status, String resolutionNotes) {
        this.status = status;
        this.resolutionNotes = resolutionNotes;
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
}
