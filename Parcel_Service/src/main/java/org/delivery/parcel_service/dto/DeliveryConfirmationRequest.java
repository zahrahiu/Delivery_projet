package org.delivery.parcel_service.dto;

import lombok.Data;

@Data
public class DeliveryConfirmationRequest {
    private String clientName;
    private String signature;
    private String deliveredAt;
    private String notes;
}