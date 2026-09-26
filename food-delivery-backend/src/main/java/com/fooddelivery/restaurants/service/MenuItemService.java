package com.fooddelivery.restaurants.service;

import com.fooddelivery.restaurants.dto.CreateMenuItemRequest;
import com.fooddelivery.restaurants.dto.MenuItemResponse;
import com.fooddelivery.restaurants.dto.UpdateMenuItemRequest;

import java.util.List;

public interface MenuItemService {

    List<MenuItemResponse> getMenuItemsForRestaurant(String restaurantId);

    List<MenuItemResponse> getActiveMenuItemsForRestaurant(String restaurantId);

    MenuItemResponse getMenuItem(String restaurantId, String itemId);

    MenuItemResponse createMenuItem(String ownerEmail, CreateMenuItemRequest request);

    MenuItemResponse updateMenuItem(String ownerEmail, String itemId, UpdateMenuItemRequest request);

    void deleteMenuItem(String ownerEmail, String itemId);

    MenuItemResponse toggleAvailability(String ownerEmail, String itemId, boolean isAvailable);
}
