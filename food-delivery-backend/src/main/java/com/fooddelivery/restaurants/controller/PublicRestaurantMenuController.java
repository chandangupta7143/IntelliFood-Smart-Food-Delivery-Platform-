package com.fooddelivery.restaurants.controller;

import com.fooddelivery.common.response.ApiResponse;
import com.fooddelivery.restaurants.dto.MenuItemResponse;
import com.fooddelivery.restaurants.service.MenuItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public/Customer menu browsing controller.
 * Exposes GET /api/restaurants/{restaurantId}/menu for customers to view real dishes.
 */
@RestController
@RequestMapping("/api/restaurants")
public class PublicRestaurantMenuController {

    private final MenuItemService menuItemService;

    public PublicRestaurantMenuController(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    @GetMapping("/{restaurantId}/menu")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getRestaurantMenu(@PathVariable String restaurantId) {
        List<MenuItemResponse> menu = menuItemService.getActiveMenuItemsForRestaurant(restaurantId);
        return ResponseEntity.ok(ApiResponse.success("Menu retrieved successfully", menu));
    }

    @GetMapping("/{restaurantId}/menu/{itemId}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getMenuItem(
            @PathVariable String restaurantId,
            @PathVariable String itemId) {
        MenuItemResponse item = menuItemService.getMenuItem(restaurantId, itemId);
        return ResponseEntity.ok(ApiResponse.success("Menu item retrieved successfully", item));
    }
}
