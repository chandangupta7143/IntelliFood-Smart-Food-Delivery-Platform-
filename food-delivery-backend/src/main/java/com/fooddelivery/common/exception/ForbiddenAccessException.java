package com.fooddelivery.common.exception;

/**
 * Thrown when an authenticated user attempts to access or mutate a resource
 * they do not own or are not authorized to manage.
 * Maps to HTTP 403 Forbidden in {@link GlobalExceptionHandler}.
 */
public class ForbiddenAccessException extends RuntimeException {
    public ForbiddenAccessException(String message) {
        super(message);
    }
}
