package com.fooddelivery.restaurants.service;

import com.fooddelivery.common.enums.Role;
import com.fooddelivery.common.exception.ResourceNotFoundException;
import com.fooddelivery.restaurants.dto.CreateMenuItemRequest;
import com.fooddelivery.restaurants.dto.MenuItemResponse;
import com.fooddelivery.restaurants.dto.UpdateMenuItemRequest;
import com.fooddelivery.restaurants.entity.MenuItem;
import com.fooddelivery.restaurants.entity.Restaurant;
import com.fooddelivery.restaurants.repository.MenuItemRepository;
import com.fooddelivery.restaurants.repository.RestaurantRepository;
import com.fooddelivery.users.entity.User;
import com.fooddelivery.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public MenuItemServiceImpl(MenuItemRepository menuItemRepository,
                               RestaurantRepository restaurantRepository,
                               UserRepository userRepository) {
        this.menuItemRepository = menuItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<MenuItemResponse> getMenuItemsForRestaurant(String restaurantId) {
        return menuItemRepository.findByRestaurantId(restaurantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MenuItemResponse> getActiveMenuItemsForRestaurant(String restaurantId) {
        return menuItemRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public MenuItemResponse getMenuItem(String restaurantId, String itemId) {
        MenuItem item = menuItemRepository.findByIdAndRestaurantId(itemId, restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + itemId));
        return toResponse(item);
    }

    @Override
    @Transactional
    public MenuItemResponse createMenuItem(String ownerEmail, CreateMenuItemRequest request) {
        Restaurant restaurant = getOwnedRestaurant(ownerEmail);

        MenuItem item = new MenuItem();
        item.setRestaurantId(restaurant.getId());
        item.setName(request.getName().trim());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setCategory(request.getCategory().trim());
        item.setImageUrl(request.getImageUrl());
        item.setVegetarian(request.isVegetarian());
        item.setPreparationTimeMinutes(request.getPreparationTimeMinutes() > 0 ? request.getPreparationTimeMinutes() : 15);
        item.setAvailable(true);
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        MenuItem saved = menuItemRepository.save(item);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public MenuItemResponse updateMenuItem(String ownerEmail, String itemId, UpdateMenuItemRequest request) {
        Restaurant restaurant = getOwnedRestaurant(ownerEmail);

        MenuItem item = menuItemRepository.findByIdAndRestaurantId(itemId, restaurant.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + itemId));

        if (request.getName() != null) item.setName(request.getName().trim());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getPrice() > 0) item.setPrice(request.getPrice());
        if (request.getCategory() != null) item.setCategory(request.getCategory().trim());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());
        if (request.getIsAvailable() != null) item.setAvailable(request.getIsAvailable());
        if (request.getIsVegetarian() != null) item.setVegetarian(request.getIsVegetarian());
        if (request.getPreparationTimeMinutes() != null) item.setPreparationTimeMinutes(request.getPreparationTimeMinutes());
        item.setUpdatedAt(LocalDateTime.now());

        MenuItem saved = menuItemRepository.save(item);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteMenuItem(String ownerEmail, String itemId) {
        Restaurant restaurant = getOwnedRestaurant(ownerEmail);

        MenuItem item = menuItemRepository.findByIdAndRestaurantId(itemId, restaurant.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + itemId));

        menuItemRepository.delete(item);
    }

    @Override
    @Transactional
    public MenuItemResponse toggleAvailability(String ownerEmail, String itemId, boolean isAvailable) {
        Restaurant restaurant = getOwnedRestaurant(ownerEmail);

        MenuItem item = menuItemRepository.findByIdAndRestaurantId(itemId, restaurant.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + itemId));

        item.setAvailable(isAvailable);
        item.setUpdatedAt(LocalDateTime.now());

        MenuItem saved = menuItemRepository.save(item);
        return toResponse(saved);
    }

    private Restaurant getOwnedRestaurant(String ownerEmail) {
        User user = userRepository.findByEmail(ownerEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + ownerEmail));

        if (user.getRole() != Role.RESTAURANT_OWNER && user.getRole() != Role.ADMIN) {
            throw new SecurityException("Only restaurant owners or administrators can manage menu items");
        }

        return restaurantRepository.findByOwnerId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No restaurant associated with owner account: " + ownerEmail));
    }

    private MenuItemResponse toResponse(MenuItem item) {
        return new MenuItemResponse(
                item.getId(),
                item.getRestaurantId(),
                item.getName(),
                item.getDescription(),
                item.getPrice(),
                item.getCategory(),
                item.getImageUrl(),
                item.isAvailable(),
                item.isVegetarian(),
                item.getPreparationTimeMinutes(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
