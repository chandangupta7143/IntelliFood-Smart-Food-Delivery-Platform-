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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuItemServiceImplTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MenuItemServiceImpl menuItemService;

    private User owner;
    private Restaurant restaurant;
    private MenuItem item;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId("owner_1");
        owner.setEmail("owner@food.com");
        owner.setRole(Role.RESTAURANT_OWNER);

        restaurant = new Restaurant();
        restaurant.setId("rest_1");
        restaurant.setName("Owner Resto");
        restaurant.setOwnerId("owner_1");

        item = new MenuItem("item_100", "rest_1", "Butter Chicken", "Rich gravy", 300.0, "Main Course", false);
    }

    @Test
    void testGetActiveMenuItemsForRestaurant() {
        when(menuItemRepository.findByRestaurantIdAndIsAvailableTrue("rest_1"))
                .thenReturn(List.of(item));

        List<MenuItemResponse> res = menuItemService.getActiveMenuItemsForRestaurant("rest_1");
        assertEquals(1, res.size());
        assertEquals("Butter Chicken", res.get(0).getName());
        assertEquals(300.0, res.get(0).getPrice());
    }

    @Test
    void testCreateMenuItem_Success() {
        CreateMenuItemRequest req = new CreateMenuItemRequest();
        req.setName("Dal Makhani");
        req.setDescription("Creamy black lentils");
        req.setPrice(220.0);
        req.setCategory("Main Course");
        req.setVegetarian(true);

        when(userRepository.findByEmail("owner@food.com")).thenReturn(Optional.of(owner));
        when(restaurantRepository.findByOwnerId("owner_1")).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> {
            MenuItem m = inv.getArgument(0);
            m.setId("new_item_id");
            return m;
        });

        MenuItemResponse res = menuItemService.createMenuItem("owner@food.com", req);
        assertNotNull(res);
        assertEquals("Dal Makhani", res.getName());
        assertEquals(220.0, res.getPrice());
        assertEquals("rest_1", res.getRestaurantId());
    }

    @Test
    void testCreateMenuItem_NonOwnerRole_ThrowsSecurityException() {
        User customer = new User();
        customer.setId("cust_1");
        customer.setEmail("cust@food.com");
        customer.setRole(Role.USER);

        when(userRepository.findByEmail("cust@food.com")).thenReturn(Optional.of(customer));

        CreateMenuItemRequest req = new CreateMenuItemRequest();
        req.setName("Dish");
        req.setPrice(100.0);
        req.setCategory("Mains");

        assertThrows(SecurityException.class, () -> menuItemService.createMenuItem("cust@food.com", req));
    }

    @Test
    void testUpdateMenuItem_OwnershipEnforced() {
        UpdateMenuItemRequest req = new UpdateMenuItemRequest();
        req.setName("Updated Chicken");
        req.setPrice(350.0);

        when(userRepository.findByEmail("owner@food.com")).thenReturn(Optional.of(owner));
        when(restaurantRepository.findByOwnerId("owner_1")).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findByIdAndRestaurantId("item_100", "rest_1")).thenReturn(Optional.of(item));
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(item);

        MenuItemResponse res = menuItemService.updateMenuItem("owner@food.com", "item_100", req);
        assertEquals("Updated Chicken", res.getName());
        assertEquals(350.0, res.getPrice());
    }

    @Test
    void testToggleAvailability_Success() {
        when(userRepository.findByEmail("owner@food.com")).thenReturn(Optional.of(owner));
        when(restaurantRepository.findByOwnerId("owner_1")).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findByIdAndRestaurantId("item_100", "rest_1")).thenReturn(Optional.of(item));
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(item);

        MenuItemResponse res = menuItemService.toggleAvailability("owner@food.com", "item_100", false);
        assertFalse(res.isAvailable());
    }
}
