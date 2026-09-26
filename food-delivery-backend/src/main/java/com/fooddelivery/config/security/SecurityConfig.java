package com.fooddelivery.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fooddelivery.auth.security.JwtAuthenticationEntryPoint;
import com.fooddelivery.auth.security.JwtAuthenticationFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration.
 * Stateless session (JWT-based), CSRF disabled, centralized CORS, and
 * public/protected endpoint rules.
 *
 * <p>CORS is configured here — NOT via scattered @CrossOrigin annotations —
 * so there is a single authoritative policy for every filter chain, including
 * preflight OPTIONS requests that Spring Security processes before they reach
 * the controller layer.</p>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
    }

    /**
     * Central CORS policy.
     *
     * <p>Allowed origins are explicit (never wildcard). For production, set the
     * {@code CORS_ALLOWED_ORIGINS} environment variable to a comma-separated list
     * of allowed frontend origins (e.g. {@code https://app.intellifood.com}).
     * If the variable is not set, defaults to local development origins.</p>
     *
     * <p>Example production env:
     * {@code CORS_ALLOWED_ORIGINS=https://app.intellifood.com,https://admin.intellifood.com}</p>
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Read production origins from environment; fall back to local dev origins.
        String corsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
        List<String> allowedOrigins;
        if (corsEnv != null && !corsEnv.isBlank()) {
            allowedOrigins = Arrays.asList(corsEnv.split(","));
        } else {
            allowedOrigins = List.of(
                    "http://localhost:5173",  // Vite dev server
                    "http://localhost:4173"   // Vite preview server
            );
        }
        config.setAllowedOrigins(allowedOrigins);

        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        // Authorization        — JWT Bearer token sent by every authenticated request
        // Content-Type         — application/json request bodies
        // Idempotency-Key      — order checkout de-duplication header (backend requirement)
        config.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Idempotency-Key"
        ));

        // Expose no custom response headers to the browser by default.
        config.setExposedHeaders(List.of());

        // Stateless JWT — no cookies, no allowCredentials needed.
        config.setAllowCredentials(false);

        // Cache preflight OPTIONS response for 1 hour.
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Attach the centralized CORS configuration before any other filter.
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/register", "/api/auth/register/restaurant-owner", "/api/auth/register/delivery-partner", "/api/auth/login").permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/ws-tracker/**").permitAll()
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .requestMatchers("/api/restaurant-owner/**").hasAnyRole("RESTAURANT_OWNER", "ADMIN")
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/restaurants/**").permitAll()
                    .requestMatchers("/api/restaurants/**").authenticated()
                    .requestMatchers("/api/search/**").authenticated()
                    .requestMatchers("/api/delivery/**").hasAnyRole("DELIVERY_PARTNER", "ADMIN")
                    .requestMatchers("/api/orders/**", "/api/vendor/orders/**").authenticated()
                    .requestMatchers("/api/notifications/**", "/api/tracking/**").authenticated()
                    .requestMatchers("/", "/healthz").permitAll()
                    .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
