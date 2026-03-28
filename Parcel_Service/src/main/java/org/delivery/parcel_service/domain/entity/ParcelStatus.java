package org.delivery.parcel_service.domain.entity;

public enum ParcelStatus {
    PENDING,
    ASSIGNED,    // تزاد
    IN_TRANSIT,
    DELIVERED,
    RETURNED,    // تزاد
    CANCELLED    // تزاد
}