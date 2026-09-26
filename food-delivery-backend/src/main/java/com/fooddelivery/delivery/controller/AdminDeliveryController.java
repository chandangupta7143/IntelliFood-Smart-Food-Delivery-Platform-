package com.fooddelivery.delivery.controller;

import com.fooddelivery.common.response.ApiResponse;
import com.fooddelivery.common.response.PaginatedResponse;
import com.fooddelivery.delivery.dto.DeliveryPartnerResponse;
import com.fooddelivery.delivery.dto.ManualAssignmentRequest;
import com.fooddelivery.delivery.entity.DeliveryPartnerStatus;
import com.fooddelivery.delivery.service.DeliveryPartnerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/delivery")
@Validated
public class AdminDeliveryController {

    private final DeliveryPartnerService service;

    public AdminDeliveryController(DeliveryPartnerService service) {
        this.service = service;
    }

    @GetMapping("/drivers")
    public ResponseEntity<ApiResponse<PaginatedResponse<DeliveryPartnerResponse>>> listDrivers(
            @RequestParam(required = false) DeliveryPartnerStatus status,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be at least 1") @Max(value = 50, message = "Size must be at most 50") int size) {
        PaginatedResponse<DeliveryPartnerResponse> response = service.listDriversForAdmin(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Delivery partners retrieved successfully", response));
    }

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<DeliveryPartnerResponse>> forceAssign(
            @RequestParam String orderId,
            @Valid @RequestBody ManualAssignmentRequest request) {
        DeliveryPartnerResponse response = service.forceAssign(request.getDriverId(), orderId);
        return ResponseEntity.ok(ApiResponse.success("Manual assignment completed successfully", response));
    }

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<DeliveryPartnerResponse>> suspendDriver(
            @PathVariable String id) {
        DeliveryPartnerResponse response = service.suspendDriver(id);
        return ResponseEntity.ok(ApiResponse.success("Driver suspended successfully", response));
    }

    @PatchMapping("/{id}/unsuspend")
    public ResponseEntity<ApiResponse<DeliveryPartnerResponse>> unsuspendDriver(
            @PathVariable String id) {
        DeliveryPartnerResponse response = service.unsuspendDriver(id);
        return ResponseEntity.ok(ApiResponse.success("Driver unsuspended successfully", response));
    }
}
