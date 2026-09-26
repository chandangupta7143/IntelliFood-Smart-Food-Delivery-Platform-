package com.fooddelivery.orders.controller;

import com.fooddelivery.common.response.ApiResponse;
import com.fooddelivery.common.response.PaginatedResponse;
import com.fooddelivery.orders.dto.FraudReviewRequest;
import com.fooddelivery.orders.dto.OrderResponse;
import com.fooddelivery.orders.entity.OrderStatus;
import com.fooddelivery.orders.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@Validated
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PatchMapping("/{id}/fraud-review")
    public ResponseEntity<ApiResponse<OrderResponse>> reviewFraud(
            @PathVariable String id,
            @Valid @RequestBody FraudReviewRequest request,
            Principal principal) {
        OrderResponse response = orderService.reviewFraud(id, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Order fraud review completed successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderResponse>>> listOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be at least 1") @Max(value = 50, message = "Size must be at most 50") int size) {
        PaginatedResponse<OrderResponse> response = orderService.listAllOrdersForAdmin(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @PatchMapping("/{id}/force-cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> forceCancel(
            @PathVariable String id,
            Principal principal) {
        OrderResponse response = orderService.forceCancelOrder(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Order force-cancelled successfully", response));
    }

    @GetMapping("/stuck")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> listStuckOrders() {
        List<OrderResponse> response = orderService.getStuckOrders();
        return ResponseEntity.ok(ApiResponse.success("Stuck orders retrieved successfully", response));
    }
}
