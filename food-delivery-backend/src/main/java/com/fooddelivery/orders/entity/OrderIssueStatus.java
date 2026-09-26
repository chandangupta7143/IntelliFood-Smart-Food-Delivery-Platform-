package com.fooddelivery.orders.entity;

/**
 * Status lifecycle for an order issue or delivery escalation.
 */
public enum OrderIssueStatus {
    OPEN,
    ACKNOWLEDGED,
    IN_PROGRESS,
    RESOLVED,
    DISMISSED
}
