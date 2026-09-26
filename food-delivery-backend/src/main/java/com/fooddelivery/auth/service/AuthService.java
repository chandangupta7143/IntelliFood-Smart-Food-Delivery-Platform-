package com.fooddelivery.auth.service;

import com.fooddelivery.auth.dto.AuthResponse;
import com.fooddelivery.auth.dto.LoginRequest;
import com.fooddelivery.auth.dto.RegisterRequest;
import com.fooddelivery.auth.security.JwtUtil;
import com.fooddelivery.common.enums.Role;
import com.fooddelivery.common.exception.InvalidCredentialsException;
import com.fooddelivery.common.exception.UserAlreadyExistsException;
import com.fooddelivery.common.exception.UserNotFoundException;
import com.fooddelivery.delivery.dto.DeliveryPartnerRegisterRequest;
import com.fooddelivery.delivery.entity.DeliveryPartner;
import com.fooddelivery.delivery.entity.DeliveryPartnerStatus;
import com.fooddelivery.delivery.entity.VehicleType;
import com.fooddelivery.delivery.repository.DeliveryPartnerRepository;
import com.fooddelivery.restaurants.dto.RestaurantOwnerRegisterRequest;
import com.fooddelivery.restaurants.entity.Restaurant;
import com.fooddelivery.restaurants.repository.RestaurantRepository;
import com.fooddelivery.users.entity.User;
import com.fooddelivery.users.repository.UserRepository;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Authentication service handling registration, login, and current user retrieval.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final DeliveryPartnerRepository deliveryPartnerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       RestaurantRepository restaurantRepository,
                       DeliveryPartnerRepository deliveryPartnerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.deliveryPartnerRepository = deliveryPartnerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Register a new user with USER role.
     * Checks for duplicate email, encrypts password, and persists.
     */
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new UserAlreadyExistsException("An account with this email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(Role.USER);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );
    }

    /**
     * Register a new RESTAURANT_OWNER and create their initial Restaurant.
     */
    public AuthResponse registerRestaurantOwner(RestaurantOwnerRegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new UserAlreadyExistsException("An account with this email already exists");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone().trim());
        user.setRole(Role.RESTAURANT_OWNER);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.getRestaurantName().trim());
        restaurant.setDescription(request.getDescription());
        restaurant.setContactPersonName(request.getName().trim());
        restaurant.setPhone(request.getPhone().trim());
        restaurant.setEmail(normalizedEmail);
        restaurant.setAddress(request.getAddress().trim());
        restaurant.setCityName(request.getCityName());
        restaurant.setCityCode(request.getCityCode());
        restaurant.setCuisines(request.getCuisines());
        restaurant.setPriceRange(request.getPriceRange() > 0 ? request.getPriceRange() : 2);
        restaurant.setAverageDeliveryTimeMinutes(request.getAverageDeliveryTimeMinutes() > 0 ? request.getAverageDeliveryTimeMinutes() : 30);
        restaurant.setMinimumOrderAmount(request.getMinimumOrderAmount());
        restaurant.setVegetarian(request.isVegetarian());
        restaurant.setLocation(new GeoJsonPoint(request.getLongitude(), request.getLatitude()));
        restaurant.setOwnerId(savedUser.getId());
        restaurant.setIsActive(true);
        restaurant.setIsVerified(true);
        restaurant.setIsDeleted(false);

        restaurantRepository.save(restaurant);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );
    }

    /**
     * Register a new delivery partner and initialize their delivery_partners profile.
     * Enforces Role.DELIVERY_PARTNER strictly server-side.
     */
    public AuthResponse registerDeliveryPartner(DeliveryPartnerRegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new UserAlreadyExistsException("An account with this email already exists");
        }

        // 1. Persist User entity with DELIVERY_PARTNER role
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone().trim());
        user.setRole(Role.DELIVERY_PARTNER);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // 2. Persist DeliveryPartner profile document with initial OFFLINE status
        DeliveryPartner partner = new DeliveryPartner();
        partner.setUserId(savedUser.getId());
        partner.setVehicleType(request.getVehicleType() != null ? request.getVehicleType() : VehicleType.MOTORCYCLE);
        partner.setStatus(DeliveryPartnerStatus.OFFLINE);
        partner.setLastActiveTime(java.time.LocalDateTime.now());
        partner.setRating(5.0);
        partner.setAcceptanceRate(100.0);
        partner.setDailyDeliveryCount(0);
        partner.setTotalAssignments(0);
        partner.setTotalAccepted(0);
        partner.setTotalRejected(0);
        partner.setTotalTimeouts(0);
        partner.setConsecutiveRejections(0);

        deliveryPartnerRepository.save(partner);

        // 3. Issue JWT
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );
    }

    /**
     * Authenticate user with email and password, return JWT token.
     */
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    /**
     * Retrieve current authenticated user's profile by email.
     */
    public AuthResponse getCurrentUser(String email) {
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        return new AuthResponse(
                null,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}
