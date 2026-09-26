package com.fooddelivery.restaurants.controller;

import com.fooddelivery.common.exception.ResourceNotFoundException;
import com.fooddelivery.common.response.ApiResponse;
import com.fooddelivery.common.response.PaginatedResponse;
import com.fooddelivery.orders.dto.OrderResponse;
import com.fooddelivery.orders.dto.OrderStatusUpdateRequest;
import com.fooddelivery.orders.entity.Order;
import com.fooddelivery.orders.entity.OrderStatus;
import com.fooddelivery.orders.repository.OrderRepository;
import com.fooddelivery.orders.service.OrderService;
import com.fooddelivery.restaurants.dto.*;
import com.fooddelivery.restaurants.entity.Restaurant;
import com.fooddelivery.restaurants.repository.MenuItemRepository;
import com.fooddelivery.restaurants.repository.RestaurantRepository;
import com.fooddelivery.restaurants.service.MenuItemService;
import com.fooddelivery.users.entity.User;
import com.fooddelivery.users.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller for RESTAURANT_OWNER operations.
 * Handles restaurant management, menu item CRUD, kitchen order lifecycle, and stats.
 */
@RestController
@RequestMapping("/api/restaurant-owner")
@Validated
public class RestaurantOwnerController {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final MenuItemService menuItemService;
    private final MenuItemRepository menuItemRepository;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final com.fooddelivery.restaurants.mapper.RestaurantMapper restaurantMapper;

    public RestaurantOwnerController(RestaurantRepository restaurantRepository,
                                     UserRepository userRepository,
                                     MenuItemService menuItemService,
                                     MenuItemRepository menuItemRepository,
                                     OrderService orderService,
                                     OrderRepository orderRepository,
                                     com.fooddelivery.restaurants.mapper.RestaurantMapper restaurantMapper) {
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
        this.menuItemService = menuItemService;
        this.menuItemRepository = menuItemRepository;
        this.orderService = orderService;
        this.orderRepository = orderRepository;
        this.restaurantMapper = restaurantMapper;
    }

    private Restaurant getAuthenticatedRestaurant(Principal principal) {
        User user = userRepository.findByEmail(principal.getName().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.getName()));

        return restaurantRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No restaurant owned by user: " + principal.getName()));
    }

    // ── Restaurant Profile & Status ──────────────────────────────────────────

    @GetMapping("/restaurant")
    public ResponseEntity<ApiResponse<RestaurantAdminResponse>> getMyRestaurant(Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);
        RestaurantAdminResponse res = restaurantMapper.toAdminResponse(restaurant);
        return ResponseEntity.ok(ApiResponse.success("Restaurant profile retrieved successfully", res));
    }

    @PutMapping("/restaurant")
    public ResponseEntity<ApiResponse<RestaurantAdminResponse>> updateMyRestaurant(
            @Valid @RequestBody RestaurantProfileUpdateRequest request,
            Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);

        if (request.getName() != null) restaurant.setName(request.getName().trim());
        if (request.getDescription() != null) restaurant.setDescription(request.getDescription());
        if (request.getCuisines() != null) restaurant.setCuisines(request.getCuisines());
        if (request.getAddress() != null) restaurant.setAddress(request.getAddress().trim());
        if (request.getPhone() != null) restaurant.setPhone(request.getPhone().trim());
        if (request.getEmail() != null) restaurant.setEmail(request.getEmail().trim());
        if (request.getPriceRange() != null) restaurant.setPriceRange(request.getPriceRange());
        if (request.getAverageDeliveryTimeMinutes() != null) restaurant.setAverageDeliveryTimeMinutes(request.getAverageDeliveryTimeMinutes());
        if (request.getMinimumOrderAmount() != null) restaurant.setMinimumOrderAmount(request.getMinimumOrderAmount());
        if (request.getIsVegetarian() != null) restaurant.setVegetarian(request.getIsVegetarian());
        if (request.getIsActive() != null) restaurant.setIsActive(request.getIsActive());

        Restaurant saved = restaurantRepository.save(restaurant);
        return ResponseEntity.ok(ApiResponse.success("Restaurant profile updated successfully", restaurantMapper.toAdminResponse(saved)));
    }

    @PatchMapping("/restaurant/status")
    public ResponseEntity<ApiResponse<RestaurantAdminResponse>> toggleRestaurantStatus(
            @RequestParam boolean isOpen,
            Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);
        restaurant.setIsActive(isOpen);
        Restaurant saved = restaurantRepository.save(restaurant);
        return ResponseEntity.ok(ApiResponse.success("Restaurant status updated to " + (isOpen ? "OPEN" : "CLOSED"), restaurantMapper.toAdminResponse(saved)));
    }

    // ── Menu Management ──────────────────────────────────────────────────────

    @GetMapping("/menu")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getMyMenu(Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);
        List<MenuItemResponse> items = menuItemService.getMenuItemsForRestaurant(restaurant.getId());
        return ResponseEntity.ok(ApiResponse.success("Menu retrieved successfully", items));
    }

    @PostMapping("/menu")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createMenuItem(
            @Valid @RequestBody CreateMenuItemRequest request,
            Principal principal) {
        MenuItemResponse created = menuItemService.createMenuItem(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Menu item created successfully", created));
    }

    @PutMapping("/menu/{itemId}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateMenuItem(
            @PathVariable String itemId,
            @Valid @RequestBody UpdateMenuItemRequest request,
            Principal principal) {
        MenuItemResponse updated = menuItemService.updateMenuItem(principal.getName(), itemId, request);
        return ResponseEntity.ok(ApiResponse.success("Menu item updated successfully", updated));
    }

    @DeleteMapping("/menu/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteMenuItem(
            @PathVariable String itemId,
            Principal principal) {
        menuItemService.deleteMenuItem(principal.getName(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Menu item deleted successfully"));
    }

    @PatchMapping("/menu/{itemId}/availability")
    public ResponseEntity<ApiResponse<MenuItemResponse>> toggleItemAvailability(
            @PathVariable String itemId,
            @RequestParam boolean available,
            Principal principal) {
        MenuItemResponse updated = menuItemService.toggleAvailability(principal.getName(), itemId, available);
        return ResponseEntity.ok(ApiResponse.success("Menu item availability updated to " + available, updated));
    }

    // ── Kitchen Order Management ─────────────────────────────────────────────

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PaginatedResponse<OrderResponse>>> getMyOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);
        PaginatedResponse<OrderResponse> orders = orderService.getRestaurantOrders(restaurant.getId(), status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Restaurant orders retrieved successfully", orders));
    }

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrderById(
            @PathVariable String orderId,
            Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);
        OrderResponse order = orderService.getRestaurantOrderById(orderId, restaurant.getId());
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", order));
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);

        // Verify order belongs to this restaurant
        orderService.getRestaurantOrderById(orderId, restaurant.getId());

        // Enforce that restaurant owner can only advance kitchen statuses
        OrderStatus targetStatus = request.getStatus();
        if (targetStatus != OrderStatus.RESTAURANT_ACCEPTED &&
            targetStatus != OrderStatus.PREPARING &&
            targetStatus != OrderStatus.READY_FOR_PICKUP &&
            targetStatus != OrderStatus.REJECTED) {
            throw new IllegalArgumentException("Restaurant owner can only transition to RESTAURANT_ACCEPTED, PREPARING, READY_FOR_PICKUP, or REJECTED");
        }

        OrderResponse updated = orderService.updateOrderStatus(orderId, targetStatus, principal.getName(), "RESTAURANT");
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully to " + targetStatus, updated));
    }

    // ── Dashboard Statistics ─────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<RestaurantDashboardStatsResponse>> getDashboardStats(Principal principal) {
        Restaurant restaurant = getAuthenticatedRestaurant(principal);
        String restId = restaurant.getId();

        int totalOrders = (int) orderRepository.countByRestaurantId(restId);
        int pending = (int) orderRepository.countByRestaurantIdAndStatus(restId, OrderStatus.CREATED);
        int accepted = (int) orderRepository.countByRestaurantIdAndStatus(restId, OrderStatus.RESTAURANT_ACCEPTED);
        int preparing = (int) orderRepository.countByRestaurantIdAndStatus(restId, OrderStatus.PREPARING);
        int ready = (int) orderRepository.countByRestaurantIdAndStatus(restId, OrderStatus.READY_FOR_PICKUP);
        int delivered = (int) orderRepository.countByRestaurantIdAndStatus(restId, OrderStatus.DELIVERED);
        int menuItemsCount = (int) menuItemRepository.countByRestaurantId(restId);

        List<Order> deliveredOrders = orderRepository.findByRestaurantIdAndStatus(restId, OrderStatus.DELIVERED);
        double totalRevenue = deliveredOrders.stream()
                .filter(o -> o.getPricing() != null)
                .mapToDouble(o -> o.getPricing().getFinalPayable())
                .sum();
        totalRevenue = Math.round(totalRevenue * 100.0) / 100.0;

        RestaurantDashboardStatsResponse stats = new RestaurantDashboardStatsResponse(
                restId,
                restaurant.getName(),
                restaurant.getIsActive(),
                totalOrders,
                pending,
                accepted + preparing,
                ready,
                delivered,
                totalRevenue,
                menuItemsCount
        );

        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }
}
