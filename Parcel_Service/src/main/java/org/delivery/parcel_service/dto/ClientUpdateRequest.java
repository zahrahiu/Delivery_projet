package org.delivery.parcel_service.dto;

import lombok.Data;

@Data
public class ClientUpdateRequest {
    private String deliveryAddress;
    private String senderPhone;
}