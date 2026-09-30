package com.fooddelivery.orders.service;

import com.fooddelivery.common.enums.Role;
import com.fooddelivery.common.exception.ResourceNotFoundException;
import com.fooddelivery.delivery.service.AssignmentEngine;
import com.fooddelivery.fraud.entity.UserRestriction;
import com.fooddelivery.fraud.repository.UserRestrictionRepository;
import com.fooddelivery.fraud.service.FraudEvaluationService;
import com.fooddelivery.notifications.service.NotificationService;
import com.fooddelivery.orders.dto.CreateOrderItemRequest;
import com.fooddelivery.orders.dto.CreateOrderRequest;
import com.fooddelivery.orders.dto.OrderResponse;
import com.fooddelivery.orders.entity.*;
import com.fooddelivery.orders.mapper.OrderMapper;
import com.fooddelivery.orders.repository.OrderRepository;
import com.fooddelivery.restaurants.entity.Restaurant;
import com.fooddelivery.restaurants.repository.RestaurantRepository;
import com.fooddelivery.users.entity.User;
import com.fooddelivery.users.repository.UserRepository;
import com.fooddelivery.surge.service.HmacTokenService;
import com.uber.h3core.H3Core;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private AssignmentEngine assignmentEngine;

    @Mock
    private NotificationService notificationService;

    @Mock
    private FraudEvaluationService fraudEvaluationService;

    @Mock
    private UserRestrictionRepository userRestrictionRepository;

    @Mock
    private HmacTokenService hmacTokenService;

    @Mock
    private com.fooddelivery.recommendations.service.RecommendationService recommendationService;

    @Mock
    private com.fooddelivery.delivery.repository.DeliveryPartnerRepository deliveryPartnerRepository;

    @Mock
    private com.fooddelivery.restaurants.repository.MenuItemRepository menuItemRepository;

    private OrderMapper orderMapper;
    private H3Core h3;
    private OrderServiceImpl orderService;

    private User customer;
    private Restaurant restaurant;
    private CreateOrderRequest createRequest;
    private Order order;

    @BeforeEach
    void setUp() throws IOException {
        orderMapper = new OrderMapper();
        h3 = H3Core.newInstance();
        orderService = new OrderServiceImpl(
                orderRepository,
                userRepository,
                restaurantRepository,
                orderMapper,
                assignmentEngine,
                notificationService,
                fraudEvaluationService,
                userRestrictionRepository,
                hmacTokenService,
                h3,
                recommendationService,
                deliveryPartnerRepository,
                menuItemRepository
        );

        customer = new User();
        customer.setId("user_customer");
        customer.setEmail("customer@food.com");
        customer.setRole(Role.USER);

        restaurant = new Restaurant();
        restaurant.setId("rest_1");
        restaurant.setName("Tandoori Hub");
        restaurant.setIsActive(true);
        restaurant.setIsVerified(true);
        restaurant.setIsDeleted(false);
        restaurant.setCuisines(List.of("Indian"));
        restaurant.setLocation(new GeoJsonPoint(77.0, 28.0));

        CreateOrderItemRequest itemReq = new CreateOrderItemRequest();
        itemReq.setItemId("item_1"); // Chick Biryani, price 250
        itemReq.setQuantity(3); // 250 * 3 = 750 (triggers discount > 500)

        createRequest = new CreateOrderRequest();
        createRequest.setRestaurantId("rest_1");
        createRequest.setItems(List.of(itemReq));
        createRequest.setDeliveryAddress("Noida Sector 62");
        createRequest.setDeliveryLatitude(28.05);
        createRequest.setDeliveryLongitude(77.05);
        createRequest.setOrderSource(OrderSource.WEB);
        createRequest.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        
        // Resolve real H3 index to match token verification
        String realH3Index = h3.latLngToCellAddress(28.05, 77.05, 8);
        String tokenPayload = "user_customer:rest_1:" + realH3Index + ":1.00:30.00:1792440120";
        String base64Payload = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(tokenPayload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        createRequest.setQuoteToken(base64Payload + ".dummySignature");
        createRequest.setSurgeMultiplier(1.0);

        order = new Order();
        order.setId("order_123");
        order.setUserId("user_customer");
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testCreateOrder_WithActiveBlockCoupons_ShouldSetZeroDiscount() {
        UserRestriction restriction = new UserRestriction("user_customer", List.of("BLOCK_COUPONS"), "Coupon Abuse", LocalDateTime.now().plusDays(5), "SYSTEM");
        com.fooddelivery.restaurants.entity.MenuItem dbMenuItem = new com.fooddelivery.restaurants.entity.MenuItem("item_1", "rest_1", "Chicken Biryani", "Delicious", 250.0, "Main Course", false);
        
        when(userRepository.findByEmail("customer@food.com")).thenReturn(Optional.of(customer));
        when(restaurantRepository.findById("rest_1")).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById("item_1")).thenReturn(Optional.of(dbMenuItem));
        when(userRestrictionRepository.findByUserId("user_customer")).thenReturn(Optional.of(restriction));
        when(hmacTokenService.verifyToken(anyString(), anyString(), anyString(), anyString(), anyDouble(), anyDouble())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrder(createRequest, "customer@food.com", "idempotency_xyz");

        verify(orderRepository).save(argThat(savedOrder -> {
            assertNotNull(savedOrder.getPricing());
            assertEquals(0.0, savedOrder.getPricing().getDiscount()); // Discount is overridden to 0
            assertEquals(750.0, savedOrder.getPricing().getItemTotal());
            return true;
        }));
    }

    @Test
    void testCreateOrder_WithoutBlockCoupons_ShouldApplyDiscount() {
        com.fooddelivery.restaurants.entity.MenuItem dbMenuItem = new com.fooddelivery.restaurants.entity.MenuItem("item_1", "rest_1", "Chicken Biryani", "Delicious", 250.0, "Main Course", false);

        when(userRepository.findByEmail("customer@food.com")).thenReturn(Optional.of(customer));
        when(restaurantRepository.findById("rest_1")).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById("item_1")).thenReturn(Optional.of(dbMenuItem));
        when(userRestrictionRepository.findByUserId("user_customer")).thenReturn(Optional.empty());
        when(hmacTokenService.verifyToken(anyString(), anyString(), anyString(), anyString(), anyDouble(), anyDouble())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderService.createOrder(createRequest, "customer@food.com", "idempotency_xyz");

        verify(orderRepository).save(argThat(savedOrder -> {
            assertNotNull(savedOrder.getPricing());
            assertEquals(50.0, savedOrder.getPricing().getDiscount()); // Discount of 50 is applied
            return true;
        }));
    }

    @Test
    void testCreateOrder_WithUnknownMenuItem_ShouldThrowResourceNotFoundException() {
        when(userRepository.findByEmail("customer@food.com")).thenReturn(Optional.of(customer));
        when(restaurantRepository.findById("rest_1")).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById("item_1")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            orderService.createOrder(createRequest, "customer@food.com", "idempotency_xyz");
        });

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testCreateOrder_WithUnavailableMenuItem_ShouldThrowIllegalArgumentException() {
        com.fooddelivery.restaurants.entity.MenuItem dbMenuItem = new com.fooddelivery.restaurants.entity.MenuItem("item_1", "rest_1", "Chicken Biryani", "Delicious", 250.0, "Main Course", false);
        dbMenuItem.setAvailable(false);

        when(userRepository.findByEmail("customer@food.com")).thenReturn(Optional.of(customer));
        when(restaurantRepository.findById("rest_1")).thenReturn(Optional.of(restaurant));
        when(menuItemRepository.findById("item_1")).thenReturn(Optional.of(dbMenuItem));

        assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(createRequest, "customer@food.com", "idempotency_xyz");
        });

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testCancelOrder_WithActiveBlockRefunds_ShouldThrowSecurityException() {
        UserRestriction restriction = new UserRestriction("user_customer", List.of("BLOCK_REFUNDS"), "Refund Abuse", LocalDateTime.now().plusDays(5), "SYSTEM");
        
        when(orderRepository.findById("order_123")).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("customer@food.com")).thenReturn(Optional.of(customer));
        when(userRestrictionRepository.findByUserId("user_customer")).thenReturn(Optional.of(restriction));

        assertThrows(SecurityException.class, () -> {
            orderService.cancelOrder("order_123", "customer@food.com");
        });

        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void testCancelOrder_WithoutBlockRefunds_ShouldAllowCancellation() {
        order.setStatus(OrderStatus.CREATED);
        when(orderRepository.findById("order_123")).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("customer@food.com")).thenReturn(Optional.of(customer));
        when(userRestrictionRepository.findByUserId("user_customer")).thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        orderService.cancelOrder("order_123", "customer@food.com");

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(PaymentStatus.REFUNDED, order.getPaymentStatus());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    void testCreateOrder_WithOnlinePaymentMethod_ShouldThrowIllegalArgumentException() {
        createRequest.setPaymentMethod(PaymentMethod.UPI);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(createRequest, "customer@food.com", "idemp_1");
        });
        assertEquals("Online payments are currently unavailable. Please select Cash on Delivery.", ex.getMessage());

        createRequest.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        ex = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(createRequest, "customer@food.com", "idemp_2");
        });
        assertEquals("Online payments are currently unavailable. Please select Cash on Delivery.", ex.getMessage());

        createRequest.setPaymentMethod(PaymentMethod.DEBIT_CARD);
        ex = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(createRequest, "customer@food.com", "idemp_3");
        });
        assertEquals("Online payments are currently unavailable. Please select Cash on Delivery.", ex.getMessage());

        createRequest.setPaymentMethod(PaymentMethod.NET_BANKING);
        ex = assertThrows(IllegalArgumentException.class, () -> {
            orderService.createOrder(createRequest, "customer@food.com", "idemp_4");
        });
        assertEquals("Online payments are currently unavailable. Please select Cash on Delivery.", ex.getMessage());

        verify(orderRepository, never()).save(any(Order.class));
    }
}
