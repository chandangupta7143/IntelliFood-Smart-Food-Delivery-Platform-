package com.fooddelivery.delivery.service;

import com.fooddelivery.common.exception.ResourceNotFoundException;
import com.fooddelivery.delivery.dto.DeliveryPartnerResponse;
import com.fooddelivery.delivery.entity.DeliveryPartner;
import com.fooddelivery.delivery.entity.DeliveryPartnerStatus;
import com.fooddelivery.delivery.entity.VehicleType;
import com.fooddelivery.delivery.mapper.DeliveryPartnerMapper;
import com.fooddelivery.delivery.repository.DeliveryPartnerRepository;
import com.fooddelivery.orders.entity.EventType;
import com.fooddelivery.orders.entity.Order;
import com.fooddelivery.orders.entity.StatusEvent;
import com.fooddelivery.orders.repository.OrderRepository;
import com.fooddelivery.users.entity.User;
import com.fooddelivery.users.repository.UserRepository;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import com.fooddelivery.tracking.service.TrackingService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fooddelivery.common.response.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.stream.Collectors;
import java.util.List;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class DeliveryPartnerServiceImpl implements DeliveryPartnerService {

    private final DeliveryPartnerRepository repository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final DeliveryPartnerMapper mapper;
    private final MongoTemplate mongoTemplate;
    private final TrackingService trackingService;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final com.fooddelivery.notifications.service.NotificationService notificationService;
    private final com.fooddelivery.restaurants.repository.RestaurantRepository restaurantRepository;

    public DeliveryPartnerServiceImpl(DeliveryPartnerRepository repository,
                                      UserRepository userRepository,
                                      OrderRepository orderRepository,
                                      DeliveryPartnerMapper mapper,
                                      MongoTemplate mongoTemplate,
                                      TrackingService trackingService,
                                      SimpMessagingTemplate simpMessagingTemplate,
                                      com.fooddelivery.notifications.service.NotificationService notificationService,
                                      com.fooddelivery.restaurants.repository.RestaurantRepository restaurantRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.mapper = mapper;
        this.mongoTemplate = mongoTemplate;
        this.trackingService = trackingService;
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.notificationService = notificationService;
        this.restaurantRepository = restaurantRepository;
    }

    @Override
    @Transactional
    public DeliveryPartnerResponse updateAvailability(String email, DeliveryPartnerStatus status) {
        User user = findUserByEmailOrThrow(email);
        DeliveryPartner partner = getOrCreatePartner(user);

        // Guard: Cannot set status to OFFLINE if driver has active order
        if (status == DeliveryPartnerStatus.OFFLINE && partner.getCurrentOrderId() != null) {
            throw new IllegalStateException("Cannot go offline while on an active delivery assignment");
        }

        partner.setStatus(status);
        partner.setLastActiveTime(LocalDateTime.now());
        partner = repository.save(partner);

        return mapper.toResponse(partner);
    }

    @Override
    @Transactional
    public DeliveryPartnerResponse updateLocation(String email, Double latitude, Double longitude) {
        User user = findUserByEmailOrThrow(email);
        DeliveryPartner partner = getOrCreatePartner(user);

        GeoJsonPoint newLoc = new GeoJsonPoint(longitude, latitude);

        // GPS Spoofing validation: Speed check
        if (partner.getCurrentLocation() != null && partner.getLastLocationUpdateTime() != null) {
            double distMeters = calculateDistanceMeters(partner.getCurrentLocation(), newLoc);
            long seconds = ChronoUnit.SECONDS.between(partner.getLastLocationUpdateTime(), LocalDateTime.now());
            if (seconds > 0 && seconds < 300) { // check within 5 minutes
                double speedKmh = (distMeters / seconds) * 3.6;
                if (speedKmh > 120.0) {
                    throw new IllegalArgumentException("Spoofed GPS location update rejected. Speed exceeds physical limits (120 km/h)");
                }
            }
        }

        partner.setCurrentLocation(newLoc);
        partner.setLastLocationUpdateTime(LocalDateTime.now());
        partner = repository.save(partner);

        // Live GPS history dump and real-time STOMP topic streaming
        final String orderId = partner.getCurrentOrderId();
        if (orderId != null) {
            try {
                trackingService.logLocationHistory(partner.getId(), orderId, partner.getCurrentLocation());
                
                // Fetch the order to enforce driver visibility lock
                orderRepository.findById(orderId).ifPresent(order -> {
                    if (order.getStatus() == com.fooddelivery.orders.entity.OrderStatus.OUT_FOR_DELIVERY ||
                        order.getStatus() == com.fooddelivery.orders.entity.OrderStatus.DELIVERED) {
                        simpMessagingTemplate.convertAndSend(
                                "/topic/orders/" + orderId,
                                new com.fooddelivery.tracking.controller.TrackingController.DriverLocationResponse(latitude, longitude)
                        );
                    }
                });
            } catch (Exception e) {
                java.util.logging.Logger.getLogger(DeliveryPartnerServiceImpl.class.getName())
                        .warning("Logistics tracking updates failed: " + e.getMessage());
            }
        }

        return mapper.toResponse(partner);
    }

    @Override
    @Transactional
    public DeliveryPartnerResponse acceptAssignment(String email, String orderId) {
        User user = findUserByEmailOrThrow(email);
        DeliveryPartner partner = repository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Double-click idempotency guard: if driver already accepted this order and is on delivery
        if (partner.getStatus() == DeliveryPartnerStatus.ON_DELIVERY && orderId.equals(partner.getCurrentOrderId())) {
            return mapper.toResponse(partner);
        }

        boolean isOffered = partner.getStatus() == DeliveryPartnerStatus.BUSY && orderId.equals(partner.getCurrentOrderId());
        boolean isOnlineAndAvailable = partner.getStatus() == DeliveryPartnerStatus.ONLINE && 
                (order.getDeliveryPartnerId() == null || partner.getId().equals(order.getDeliveryPartnerId()));

        if (!isOffered && !isOnlineAndAvailable) {
            throw new IllegalStateException("Driver is not currently offered this order assignment");
        }

        // Enforce Acceptance state transition
        partner.setStatus(DeliveryPartnerStatus.ON_DELIVERY);
        partner.setCurrentOrderId(orderId);
        partner.setTotalAccepted(partner.getTotalAccepted() + 1);
        partner.setConsecutiveRejections(0);
        partner.setLastActiveTime(LocalDateTime.now());
        partner = repository.save(partner);

        // Update Order log & record operational responsibility handoff
        order.setDeliveryPartnerId(partner.getId());
        order.setResponsibleParty(com.fooddelivery.orders.entity.ResponsibleParty.DELIVERY_PARTNER);
        order.getStatusHistory().add(new StatusEvent(
                order.getStatus(),
                EventType.DELIVERY_PARTNER_ACTION,
                LocalDateTime.now(),
                partner.getId(),
                "DELIVERY_PARTNER"
        ));
        orderRepository.save(order);

        // Handoff Notifications:
        String restName = order.getRestaurantName() != null ? order.getRestaurantName() : "the restaurant";
        String ordNum = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId();
        String driverName = user.getName() != null ? user.getName() : "A delivery partner";

        try {
            // 1. Notify Customer of driver assignment
            notificationService.sendNotification(
                    order.getUserId(),
                    order.getId() + "_assigned_cust",
                    com.fooddelivery.notifications.entity.NotificationType.ORDER,
                    "Delivery Partner Assigned",
                    driverName + " has accepted your order and is arriving at " + restName + " for pickup.",
                    "HIGH"
            );

            // 2. Notify Restaurant Owner of driver assignment
            if (order.getRestaurantId() != null) {
                restaurantRepository.findById(order.getRestaurantId()).ifPresent(rest -> {
                    if (rest.getOwnerId() != null) {
                        notificationService.sendNotification(
                                rest.getOwnerId(),
                                order.getId() + "_assigned_rest",
                                com.fooddelivery.notifications.entity.NotificationType.ORDER,
                                "Delivery Partner Assigned: #" + ordNum,
                                driverName + " has been assigned to Order #" + ordNum + " and is en route for pickup.",
                                "HIGH"
                        );
                    }
                });
            }

            // 3. Notify Driver of assignment confirmation
            notificationService.sendNotification(
                    user.getId(),
                    order.getId() + "_assigned_driver",
                    com.fooddelivery.notifications.entity.NotificationType.ORDER,
                    "Assignment Confirmed: #" + ordNum,
                    "You accepted Order #" + ordNum + ". Proceed to " + restName + " for pickup.",
                    "HIGH"
            );

            // 4. Broadcast live update to STOMP topic
            simpMessagingTemplate.convertAndSend("/topic/orders/" + order.getId(), mapper.toResponse(partner));
        } catch (Exception ex) {
            java.util.logging.Logger.getLogger(DeliveryPartnerServiceImpl.class.getName())
                    .warning("Failed to dispatch assignment handoff notifications: " + ex.getMessage());
        }

        return mapper.toResponse(partner);
    }

    @Override
    @Transactional
    public DeliveryPartnerResponse rejectAssignment(String email, String orderId) {
        User user = findUserByEmailOrThrow(email);
        DeliveryPartner partner = repository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isOffered = partner.getStatus() == DeliveryPartnerStatus.BUSY && orderId.equals(partner.getCurrentOrderId());
        boolean isPrePickupCancel = partner.getStatus() == DeliveryPartnerStatus.ON_DELIVERY && 
                orderId.equals(partner.getCurrentOrderId()) && 
                order.getStatus() != com.fooddelivery.orders.entity.OrderStatus.OUT_FOR_DELIVERY && 
                order.getStatus() != com.fooddelivery.orders.entity.OrderStatus.DELIVERED;

        if (!isOffered && !isPrePickupCancel) {
            if (partner.getStatus() == DeliveryPartnerStatus.ON_DELIVERY && 
                    order.getStatus() == com.fooddelivery.orders.entity.OrderStatus.OUT_FOR_DELIVERY) {
                throw new IllegalStateException("Cannot cancel assignment after picking up food. Please report an issue to support.");
            }
            throw new IllegalStateException("Driver is not currently offered or assigned to this order");
        }

        // Rejection update
        partner.setTotalRejected(partner.getTotalRejected() + 1);
        partner.setConsecutiveRejections(partner.getConsecutiveRejections() + 1);
        
        if (partner.getConsecutiveRejections() >= 3) {
            partner.setStatus(DeliveryPartnerStatus.SUSPENDED);
        } else {
            partner.setStatus(DeliveryPartnerStatus.ONLINE);
        }

        partner.setCurrentOrderId(null);
        partner.setLastActiveTime(LocalDateTime.now());
        partner = repository.save(partner);

        // Release Order & return responsibility to RESTAURANT
        order.setDeliveryPartnerId(null);
        order.setResponsibleParty(com.fooddelivery.orders.entity.ResponsibleParty.RESTAURANT);
        order.getStatusHistory().add(new StatusEvent(
                order.getStatus(),
                EventType.DELIVERY_PARTNER_ACTION,
                LocalDateTime.now(),
                partner.getId(),
                isPrePickupCancel ? "DELIVERY_PARTNER_CANCELLED_PICKUP" : "DELIVERY_PARTNER_REJECTED"
        ));
        orderRepository.save(order);

        // Notify customer if pre-pickup cancelled so they know another driver is being assigned
        if (isPrePickupCancel) {
            try {
                notificationService.sendNotification(
                        order.getUserId(),
                        order.getId() + "_driver_unassigned_cust",
                        com.fooddelivery.notifications.entity.NotificationType.ORDER,
                        "Finding a new Delivery Partner",
                        "Your previous delivery partner had to cancel pickup. We are matching a new partner for your order.",
                        "MEDIUM"
                );
            } catch (Exception ignored) {}
        }

        return mapper.toResponse(partner);
    }

    @Override
    public DeliveryPartnerResponse getAssignedOrder(String email) {
        User user = findUserByEmailOrThrow(email);
        DeliveryPartner partner = repository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));

        return mapper.toResponse(partner);
    }

    @Override
    @Transactional
    public DeliveryPartnerResponse forceAssign(String driverId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // 1. Order Status Guard: Only orders waiting for pickup or out for delivery can be assigned/reassigned
        if (order.getStatus() != com.fooddelivery.orders.entity.OrderStatus.READY_FOR_PICKUP
                && order.getStatus() != com.fooddelivery.orders.entity.OrderStatus.OUT_FOR_DELIVERY) {
            throw new IllegalStateException("Cannot assign driver to order in status: " + order.getStatus());
        }

        DeliveryPartner newPartner = repository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));

        if (newPartner.getStatus() == DeliveryPartnerStatus.SUSPENDED) {
            throw new IllegalStateException("Cannot assign suspended driver");
        }

        // Check if new driver is already occupied with a different active delivery
        if (newPartner.getStatus() == DeliveryPartnerStatus.ON_DELIVERY
                && newPartner.getCurrentOrderId() != null
                && !orderId.equals(newPartner.getCurrentOrderId())) {
            throw new IllegalStateException("Driver is already on delivery for another order: " + newPartner.getCurrentOrderId());
        }

        String oldDriverId = order.getDeliveryPartnerId();

        // Idempotency: If requested driver is already assigned to this order, return directly
        if (driverId.equals(oldDriverId) && newPartner.getStatus() == DeliveryPartnerStatus.ON_DELIVERY && orderId.equals(newPartner.getCurrentOrderId())) {
            return mapper.toResponse(newPartner);
        }

        // 2. Release previous driver if one exists and is different
        if (oldDriverId != null && !oldDriverId.equals(driverId)) {
            repository.findById(oldDriverId).ifPresent(oldDriver -> {
                oldDriver.setStatus(DeliveryPartnerStatus.ONLINE);
                oldDriver.setCurrentOrderId(null);
                oldDriver.setLastActiveTime(LocalDateTime.now());
                repository.save(oldDriver);

                // Notify previous driver of reassignment
                try {
                    String ordNum = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId();
                    notificationService.sendNotification(
                            oldDriver.getUserId(),
                            order.getId() + "_admin_reassigned_old_driver",
                            com.fooddelivery.notifications.entity.NotificationType.ORDER,
                            "Order Reassigned by Dispatch",
                            "Order #" + ordNum + " has been reassigned to another delivery partner by dispatch.",
                            "HIGH"
                    );
                } catch (Exception ex) {
                    java.util.logging.Logger.getLogger(DeliveryPartnerServiceImpl.class.getName())
                            .warning("Failed to notify previous driver of reassignment: " + ex.getMessage());
                }
            });
        }

        // 3. Assign new driver
        newPartner.setStatus(DeliveryPartnerStatus.ON_DELIVERY);
        newPartner.setCurrentOrderId(orderId);
        newPartner.setLastActiveTime(LocalDateTime.now());
        newPartner = repository.save(newPartner);

        // 4. Update order details while preserving existing order.status
        order.setDeliveryPartnerId(driverId);
        order.setResponsibleParty(com.fooddelivery.orders.entity.ResponsibleParty.DELIVERY_PARTNER);
        order.getStatusHistory().add(new StatusEvent(
                order.getStatus(),
                EventType.ADMIN_OVERRIDE,
                LocalDateTime.now(),
                "ADMIN",
                "ADMIN_FORCE_ASSIGN"
        ));
        orderRepository.save(order);

        // Notify new driver & customer of assignment
        try {
            String ordNum = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId();
            String restName = order.getRestaurantName() != null ? order.getRestaurantName() : "the restaurant";

            notificationService.sendNotification(
                    newPartner.getUserId(),
                    order.getId() + "_admin_assigned_new_driver",
                    com.fooddelivery.notifications.entity.NotificationType.ORDER,
                    "Dispatch Assignment: #" + ordNum,
                    "You have been assigned to Order #" + ordNum + " (" + restName + ") by dispatch.",
                    "HIGH"
            );

            notificationService.sendNotification(
                    order.getUserId(),
                    order.getId() + "_admin_assigned_cust",
                    com.fooddelivery.notifications.entity.NotificationType.ORDER,
                    "Delivery Partner Updated",
                    "A new delivery partner has been assigned to your order by dispatch.",
                    "HIGH"
            );

            simpMessagingTemplate.convertAndSend("/topic/orders/" + order.getId(), mapper.toResponse(newPartner));
        } catch (Exception ex) {
            java.util.logging.Logger.getLogger(DeliveryPartnerServiceImpl.class.getName())
                    .warning("Failed to dispatch reassignment notifications: " + ex.getMessage());
        }

        return mapper.toResponse(newPartner);
    }

    @Override
    @Transactional
    public DeliveryPartnerResponse suspendDriver(String driverId) {
        DeliveryPartner partner = repository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        partner.setStatus(DeliveryPartnerStatus.SUSPENDED);
        partner.setLastActiveTime(LocalDateTime.now());
        partner = repository.save(partner);

        return mapper.toResponse(partner);
    }

    @Override
    @Transactional
    public DeliveryPartnerResponse unsuspendDriver(String driverId) {
        DeliveryPartner partner = repository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found"));

        partner.setStatus(DeliveryPartnerStatus.OFFLINE);
        partner.setConsecutiveRejections(0);
        partner.setLastActiveTime(LocalDateTime.now());
        partner = repository.save(partner);

        return mapper.toResponse(partner);
    }

    private User findUserByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private DeliveryPartner getOrCreatePartner(User user) {
        return repository.findByUserId(user.getId())
                .orElseGet(() -> {
                    DeliveryPartner partner = new DeliveryPartner();
                    partner.setUserId(user.getId());
                    partner.setStatus(DeliveryPartnerStatus.OFFLINE);
                    partner.setVehicleType(VehicleType.MOTORCYCLE);
                    return repository.save(partner);
                });
    }

    private double calculateDistanceMeters(GeoJsonPoint p1, GeoJsonPoint p2) {
        if (p1 == null || p2 == null) return 999999.0;
        double rx = p1.getX();
        double ry = p1.getY();
        double dx = p2.getX();
        double dy = p2.getY();
        return Math.sqrt(Math.pow(dx - rx, 2) + Math.pow(dy - ry, 2)) * 111000.0;
    }

    @Override
    public PaginatedResponse<DeliveryPartnerResponse> listDriversForAdmin(DeliveryPartnerStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastActiveTime"));
        Page<DeliveryPartner> result = (status != null)
                ? repository.findByStatus(status, pageable)
                : repository.findAll(pageable);

        List<DeliveryPartnerResponse> content = result.getContent().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(content, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }
}
