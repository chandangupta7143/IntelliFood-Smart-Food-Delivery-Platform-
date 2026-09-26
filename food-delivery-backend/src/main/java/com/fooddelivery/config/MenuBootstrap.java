package com.fooddelivery.config;

import com.fooddelivery.common.enums.Role;
import com.fooddelivery.restaurants.entity.MenuItem;
import com.fooddelivery.restaurants.entity.Restaurant;
import com.fooddelivery.restaurants.repository.MenuItemRepository;
import com.fooddelivery.restaurants.repository.RestaurantRepository;
import com.fooddelivery.users.entity.User;
import com.fooddelivery.users.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.logging.Logger;

/**
 * Bootstraps a default RESTAURANT_OWNER seed account and links it to an existing restaurant.
 * Credentials are loaded from environment variables — never hardcoded in source.
 *
 * Environment variables consumed:
 *   RESTAURANT_OWNER_EMAIL     (default: owner@fooddelivery.com)
 *   RESTAURANT_OWNER_PASSWORD  (default: ChangeMe@Dev123  — must be overridden in production)
 *   RESTAURANT_OWNER_NAME      (default: Chef Ramesh (Owner))
 */
@Component
public class MenuBootstrap implements CommandLineRunner {

    private static final Logger logger = Logger.getLogger(MenuBootstrap.class.getName());

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${restaurant.owner.email}")
    private String ownerEmail;

    @Value("${restaurant.owner.password}")
    private String ownerPassword;

    @Value("${restaurant.owner.name}")
    private String ownerName;

    public MenuBootstrap(UserRepository userRepository,
                         RestaurantRepository restaurantRepository,
                         MenuItemRepository menuItemRepository,
                         PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            String normalizedEmail = ownerEmail.trim().toLowerCase();

            // 1. Ensure a default RESTAURANT_OWNER user exists (idempotent)
            User owner = userRepository.findByEmail(normalizedEmail).orElseGet(() -> {
                User u = new User();
                u.setName(ownerName.trim());
                u.setEmail(normalizedEmail);
                u.setPassword(passwordEncoder.encode(ownerPassword));
                u.setPhone("9876543299");
                u.setRole(Role.RESTAURANT_OWNER);
                u.setIsActive(true);
                User saved = userRepository.save(u);
                logger.info("Bootstrapped default restaurant owner: " + normalizedEmail);
                return saved;
            });

            // 2. Link an existing restaurant (idempotent — only assigns if ownerId is null)
            List<Restaurant> allRestaurants = restaurantRepository.findAll();
            if (!allRestaurants.isEmpty()) {
                Restaurant targetRestaurant = null;
                for (Restaurant r : allRestaurants) {
                    if (r.getOwnerId() == null || r.getOwnerId().equals(owner.getId())) {
                        targetRestaurant = r;
                        break;
                    }
                }

                if (targetRestaurant != null) {
                    if (targetRestaurant.getOwnerId() == null) {
                        targetRestaurant.setOwnerId(owner.getId());
                        restaurantRepository.save(targetRestaurant);
                        logger.info("Assigned owner " + normalizedEmail + " to restaurant: " + targetRestaurant.getName());
                    }

                    // 3. Seed the 5 standard menu items if restaurant has 0 menu items (idempotent)
                    long itemCount = menuItemRepository.countByRestaurantId(targetRestaurant.getId());
                    if (itemCount == 0) {
                        seedDefaultMenuItems(targetRestaurant.getId());
                    }
                }
            }
        } catch (Exception e) {
            logger.warning("MenuBootstrap failed: " + e.getMessage());
        }
    }

    private void seedDefaultMenuItems(String restaurantId) {
        List<MenuItem> items = List.of(
                new MenuItem("item_1", restaurantId, "Chicken Biryani", "Aromatic basmati rice cooked with tender spiced chicken and saffron", 250.0, "Main Course", false),
                new MenuItem("item_2", restaurantId, "Paneer Butter Masala", "Cubes of fresh cottage cheese simmered in a rich, buttery makhani gravy", 180.0, "Main Course", true),
                new MenuItem("item_3", restaurantId, "Garlic Naan", "Traditional tandoori flatbread topped with minced garlic and butter", 40.0, "Breads", true),
                new MenuItem("item_4", restaurantId, "Chocolate Brownie", "Warm, gooey chocolate fudge brownie with crushed walnuts", 120.0, "Desserts", true),
                new MenuItem("item_5", restaurantId, "Mango Shake", "Creamy, chilled shake made with fresh Alphonso mango pulp", 90.0, "Beverages", true)
        );

        for (MenuItem item : items) {
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());
            menuItemRepository.save(item);
        }
        logger.info("Seeded 5 real MongoDB menu items for restaurant: " + restaurantId);
    }
}
