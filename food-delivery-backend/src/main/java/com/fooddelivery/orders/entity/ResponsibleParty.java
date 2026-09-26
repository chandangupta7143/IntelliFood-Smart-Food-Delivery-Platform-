package com.fooddelivery.orders.entity;

/**
 * Represents the actor that currently holds operational custody and responsibility for an Order.
 */
public enum ResponsibleParty {
    CUSTOMER,
    RESTAURANT,
    DELIVERY_PARTNER,
    ADMIN_SUPPORT,
    NONE
}
