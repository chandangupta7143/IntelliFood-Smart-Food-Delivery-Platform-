package com.fooddelivery.orders.controller;

import com.fooddelivery.common.response.ApiResponse;
import com.fooddelivery.common.response.PaginatedResponse;
import com.fooddelivery.orders.dto.CreateOrderIssueRequest;
import com.fooddelivery.orders.dto.OrderIssueResponse;
import com.fooddelivery.orders.dto.ResolveOrderIssueRequest;
import com.fooddelivery.orders.entity.OrderIssueStatus;
import com.fooddelivery.orders.service.OrderIssueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@Validated
public class OrderIssueController {

    private final OrderIssueService issueService;

    public OrderIssueController(OrderIssueService issueService) {
        this.issueService = issueService;
    }

    @PostMapping("/api/orders/{orderId}/issues")
    public ResponseEntity<ApiResponse<OrderIssueResponse>> reportIssue(
            @PathVariable String orderId,
            @Valid @RequestBody CreateOrderIssueRequest request,
            Principal principal) {
        OrderIssueResponse response = issueService.reportIssue(orderId, request, principal.getName());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Issue reported successfully", response));
    }

    @GetMapping("/api/orders/{orderId}/issues")
    public ResponseEntity<ApiResponse<List<OrderIssueResponse>>> getIssuesForOrder(
            @PathVariable String orderId,
            Principal principal) {
        List<OrderIssueResponse> list = issueService.getIssuesForOrder(orderId, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Order issues retrieved successfully", list));
    }

    @GetMapping("/api/admin/issues")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderIssueResponse>>> listAllIssues(
            @RequestParam(required = false) OrderIssueStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {
        PaginatedResponse<OrderIssueResponse> response = issueService.listAllIssues(status, page, size, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("All operational issues retrieved", response));
    }

    @PatchMapping("/api/admin/issues/{issueId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderIssueResponse>> resolveIssue(
            @PathVariable String issueId,
            @Valid @RequestBody ResolveOrderIssueRequest request,
            Principal principal) {
        OrderIssueResponse response = issueService.resolveIssue(issueId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Issue resolved successfully", response));
    }
}
