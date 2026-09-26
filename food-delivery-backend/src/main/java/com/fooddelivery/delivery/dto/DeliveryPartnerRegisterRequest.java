package com.fooddelivery.delivery.dto;

import com.fooddelivery.delivery.entity.VehicleType;
import jakarta.validation.constraints.*;

/**
 * Request payload for Delivery Partner self-registration.
 * Role is strictly assigned server-side as Role.DELIVERY_PARTNER.
 */
public class DeliveryPartnerRegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10,15}$", message = "Phone must be 10-15 digits")
    private String phone;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType = VehicleType.MOTORCYCLE;

    public DeliveryPartnerRegisterRequest() {
    }

    public DeliveryPartnerRegisterRequest(String name, String email, String password, String phone, VehicleType vehicleType) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.vehicleType = vehicleType;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }
}
