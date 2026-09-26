package com.fooddelivery.orders.service;

import com.fooddelivery.common.enums.Role;
import com.fooddelivery.common.exception.ResourceNotFoundException;
import com.fooddelivery.common.response.PaginatedResponse;
import com.fooddelivery.delivery.repository.DeliveryPartnerRepository;
import com.fooddelivery.notifications.entity.NotificationType;
import com.fooddelivery.notifications.service.NotificationService;
import com.fooddelivery.orders.dto.CreateOrderIssueRequest;
import com.fooddelivery.orders.dto.OrderIssueResponse;
import com.fooddelivery.orders.dto.ResolveOrderIssueRequest;
import com.fooddelivery.orders.entity.*;
import com.fooddelivery.orders.repository.OrderIssueRepository;
import com.fooddelivery.orders.repository.OrderRepository;
import com.fooddelivery.restaurants.entity.Restaurant;
import com.fooddelivery.restaurants.repository.RestaurantRepository;
import com.fooddelivery.users.entity.User;
import com.fooddelivery.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class OrderIssueServiceImpl implements OrderIssueService {

    private static final Logger logger = Logger.getLogger(OrderIssueServiceImpl.class.getName());

    private final OrderIssueRepository issueRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final DeliveryPartnerRepository partnerRepository;
    private final NotificationService notificationService;

    public OrderIssueServiceImpl(OrderIssueRepository issueRepository,
                                 OrderRepository orderRepository,
                                 UserRepository userRepository,
                                 RestaurantRepository restaurantRepository,
                                 DeliveryPartnerRepository partnerRepository,
                                 NotificationService notificationService) {
        this.issueRepository = issueRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.partnerRepository = partnerRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public OrderIssueResponse reportIssue(String orderId, CreateOrderIssueRequest request, String principalEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        User user = userRepository.findByEmail(principalEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + principalEmail));

        // Ownership & Role Verification:
        // Only the customer, the restaurant owner, the assigned delivery partner, or admin can report an issue
        boolean isCustomer = order.getUserId() != null && order.getUserId().equals(user.getId());
        boolean isRestaurantOwner = false;
        Restaurant restaurant = null;
        if (order.getRestaurantId() != null) {
            restaurant = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
            if (restaurant != null && restaurant.getOwnerId() != null && restaurant.getOwnerId().equals(user.getId())) {
                isRestaurantOwner = true;
            }
        }

        boolean isAssignedDriver = false;
        if (order.getDeliveryPartnerId() != null) {
            isAssignedDriver = order.getDeliveryPartnerId().equals(user.getId()) ||
                    partnerRepository.findByUserId(user.getId())
                            .map(dp -> dp.getId().equals(order.getDeliveryPartnerId()))
                            .orElse(false);
        }

        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isCustomer && !isRestaurantOwner && !isAssignedDriver && !isAdmin) {
            throw new SecurityException("You do not have permission to report an issue for this order");
        }

        // Idempotency check: if the user reported the exact same category issue in the last 15 seconds, return it
        List<OrderIssue> existingIssues = issueRepository.findByOrderId(order.getId());
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(15);
        for (OrderIssue existing : existingIssues) {
            if (existing.getReportedByUserId().equals(user.getId())
                    && existing.getCategory() == request.getCategory()
                    && existing.getStatus() == OrderIssueStatus.OPEN
                    && existing.getCreatedAt() != null
                    && existing.getCreatedAt().isAfter(cutoff)) {
                return toResponse(existing);
            }
        }

        // Create and save issue
        OrderIssue issue = new OrderIssue(
                order.getId(),
                order.getOrderNumber(),
                order.getRestaurantId(),
                user.getId(),
                user.getRole().name(),
                user.getName(),
                request.getCategory(),
                request.getDescription().trim()
        );
        issue = issueRepository.save(issue);

        // Record event in order status history
        EventType eventType = EventType.SYSTEM_EVENT;
        if (isCustomer) eventType = EventType.USER_ACTION;
        else if (isRestaurantOwner) eventType = EventType.VENDOR_ACTION;
        else if (isAssignedDriver) eventType = EventType.DELIVERY_PARTNER_ACTION;
        else if (isAdmin) eventType = EventType.ADMIN_OVERRIDE;

        StatusEvent event = new StatusEvent(
                order.getStatus(),
                eventType,
                LocalDateTime.now(),
                user.getId(),
                user.getRole().name()
        );
        order.getStatusHistory().add(event);
        orderRepository.save(order);

        // Notifications
        dispatchIssueNotifications(order, restaurant, user, issue);

        return toResponse(issue);
    }

    @Override
    public List<OrderIssueResponse> getIssuesForOrder(String orderId, String principalEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        User user = userRepository.findByEmail(principalEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + principalEmail));

        boolean isCustomer = order.getUserId() != null && order.getUserId().equals(user.getId());
        boolean isRestaurantOwner = false;
        if (order.getRestaurantId() != null) {
            Restaurant restaurant = restaurantRepository.findById(order.getRestaurantId()).orElse(null);
            if (restaurant != null && restaurant.getOwnerId() != null && restaurant.getOwnerId().equals(user.getId())) {
                isRestaurantOwner = true;
            }
        }
        boolean isAssignedDriver = order.getDeliveryPartnerId() != null && (
                order.getDeliveryPartnerId().equals(user.getId()) ||
                        partnerRepository.findByUserId(user.getId()).map(dp -> dp.getId().equals(order.getDeliveryPartnerId())).orElse(false)
        );
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isCustomer && !isRestaurantOwner && !isAssignedDriver && !isAdmin) {
            throw new SecurityException("Unauthorized access to order issues");
        }

        return issueRepository.findByOrderId(orderId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaginatedResponse<OrderIssueResponse> listAllIssues(OrderIssueStatus status, int page, int size, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new SecurityException("Only admin users can list operational issues");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OrderIssue> issuesPage = (status != null)
                ? issueRepository.findByStatus(status, pageable)
                : issueRepository.findAll(pageable);

        List<OrderIssueResponse> list = issuesPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(list, issuesPage.getNumber(), issuesPage.getSize(), issuesPage.getTotalElements(), issuesPage.getTotalPages());
    }

    @Override
    @Transactional
    public OrderIssueResponse resolveIssue(String issueId, ResolveOrderIssueRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new SecurityException("Only admin users can resolve operational issues");
        }

        OrderIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + issueId));

        issue.setStatus(request.getStatus());
        issue.setResolutionNotes(request.getResolutionNotes().trim());
        issue.setResolvedByUserId(admin.getId());
        issue.setResolvedByName(admin.getName());
        issue.setResolvedAt(LocalDateTime.now());
        issue = issueRepository.save(issue);

        // Notify reporter of resolution
        try {
            notificationService.sendNotification(
                    issue.getReportedByUserId(),
                    UUID.randomUUID().toString(),
                    NotificationType.SYSTEM,
                    "Support Issue Updated: " + request.getStatus(),
                    "Your reported issue on Order #" + issue.getOrderNumber() + " has been marked " + request.getStatus() + ". Notes: " + request.getResolutionNotes(),
                    "HIGH"
            );
        } catch (Exception e) {
            logger.warning("Failed to dispatch issue resolution notification: " + e.getMessage());
        }

        return toResponse(issue);
    }

    private void dispatchIssueNotifications(Order order, Restaurant restaurant, User reporter, OrderIssue issue) {
        String eventId = UUID.randomUUID().toString();
        try {
            // If reported by delivery partner: notify restaurant owner & customer
            if (reporter.getRole() == Role.DELIVERY_PARTNER) {
                if (restaurant != null && restaurant.getOwnerId() != null) {
                    notificationService.sendNotification(
                            restaurant.getOwnerId(),
                            eventId + "_rest",
                            NotificationType.ORDER,
                            "Delivery Issue Reported",
                            "Driver reported '" + issue.getCategory() + "' on Order #" + order.getOrderNumber() + ": " + issue.getDescription(),
                            "HIGH"
                    );
                }
                notificationService.sendNotification(
                        order.getUserId(),
                        eventId + "_cust",
                        NotificationType.ORDER,
                        "Delivery Delay / Issue Update",
                        "Your delivery partner noted an issue (" + issue.getCategory() + ") on Order #" + order.getOrderNumber() + ". Support is assisting.",
                        "HIGH"
                );
            } else if (reporter.getRole() == Role.USER) {
                // If reported by customer: notify restaurant owner
                if (restaurant != null && restaurant.getOwnerId() != null) {
                    notificationService.sendNotification(
                            restaurant.getOwnerId(),
                            eventId + "_rest",
                            NotificationType.ORDER,
                            "Customer Issue Reported",
                            "Customer reported '" + issue.getCategory() + "' on Order #" + order.getOrderNumber() + ": " + issue.getDescription(),
                            "HIGH"
                    );
                }
            }
        } catch (Exception ex) {
            logger.warning("Failed to dispatch issue notifications: " + ex.getMessage());
        }
    }

    private OrderIssueResponse toResponse(OrderIssue issue) {
        OrderIssueResponse res = new OrderIssueResponse();
        res.setId(issue.getId());
        res.setOrderId(issue.getOrderId());
        res.setOrderNumber(issue.getOrderNumber());
        res.setRestaurantId(issue.getRestaurantId());
        res.setReportedByUserId(issue.getReportedByUserId());
        res.setReportedByRole(issue.getReportedByRole());
        res.setReportedByName(issue.getReportedByName());
        res.setCategory(issue.getCategory());
        res.setDescription(issue.getDescription());
        res.setStatus(issue.getStatus());
        res.setResolutionNotes(issue.getResolutionNotes());
        res.setResolvedByUserId(issue.getResolvedByUserId());
        res.setResolvedByName(issue.getResolvedByName());
        res.setResolvedAt(issue.getResolvedAt());
        res.setCreatedAt(issue.getCreatedAt());
        res.setUpdatedAt(issue.getUpdatedAt());
        return res;
    }
}
