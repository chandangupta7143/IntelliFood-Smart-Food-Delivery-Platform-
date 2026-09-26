package com.fooddelivery.admin.controller;

import com.fooddelivery.admin.dto.DashboardStatsResponse;
import com.fooddelivery.common.response.ApiResponse;
import com.fooddelivery.delivery.entity.DeliveryPartnerStatus;
import com.fooddelivery.delivery.repository.DeliveryPartnerRepository;
import com.fooddelivery.orders.entity.Order;
import com.fooddelivery.orders.entity.OrderStatus;
import com.fooddelivery.orders.repository.OrderRepository;
import com.fooddelivery.restaurants.repository.RestaurantRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final OrderRepository orderRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final RestaurantRepository restaurantRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public AdminDashboardController(OrderRepository orderRepository,
                                    DeliveryPartnerRepository deliveryPartnerRepository,
                                    RestaurantRepository restaurantRepository,
                                    RedisTemplate<String, Object> redisTemplate) {
        this.orderRepository = orderRepository;
        this.deliveryPartnerRepository = deliveryPartnerRepository;
        this.restaurantRepository = restaurantRepository;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        long totalOrders = orderRepository.count();
        long pendingReview = orderRepository.countByStatus(OrderStatus.PENDING_REVIEW);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED) + orderRepository.countByStatus(OrderStatus.REJECTED);
        long active = orderRepository.countByStatus(OrderStatus.CREATED)
                + orderRepository.countByStatus(OrderStatus.RESTAURANT_ACCEPTED)
                + orderRepository.countByStatus(OrderStatus.PREPARING)
                + orderRepository.countByStatus(OrderStatus.READY_FOR_PICKUP)
                + orderRepository.countByStatus(OrderStatus.OUT_FOR_DELIVERY);

        List<Order> deliveredOrders = orderRepository.findByStatus(OrderStatus.DELIVERED);
        double totalRevenue = deliveredOrders.stream()
                .filter(o -> o.getPricing() != null)
                .mapToDouble(o -> o.getPricing().getFinalPayable())
                .sum();

        long totalDrivers = deliveryPartnerRepository.count();
        long onlineDrivers = deliveryPartnerRepository.countByStatus(DeliveryPartnerStatus.ONLINE);
        long busyDrivers = deliveryPartnerRepository.countByStatus(DeliveryPartnerStatus.BUSY)
                + deliveryPartnerRepository.countByStatus(DeliveryPartnerStatus.ON_DELIVERY);

        long totalRestaurants = restaurantRepository.count();
        long activeRestaurants = restaurantRepository.countByIsActiveTrueAndIsDeletedFalse();

        boolean surgeDisabled = Boolean.TRUE.equals(redisTemplate.hasKey("surge:emergency:disabled"));

        stats.setTotalOrders(totalOrders);
        stats.setActiveOrders(active);
        stats.setPendingReviewOrders(pendingReview);
        stats.setDeliveredOrders(delivered);
        stats.setCancelledOrders(cancelled);
        stats.setTotalRevenue(Math.round(totalRevenue * 100.0) / 100.0);

        stats.setTotalDrivers(totalDrivers);
        stats.setOnlineDrivers(onlineDrivers);
        stats.setBusyDrivers(busyDrivers);

        stats.setTotalRestaurants(totalRestaurants);
        stats.setActiveRestaurants(activeRestaurants);

        stats.setFraudQueueCount(pendingReview);
        stats.setSurgeEmergencyDisabled(surgeDisabled);

        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved successfully", stats));
    }
}
