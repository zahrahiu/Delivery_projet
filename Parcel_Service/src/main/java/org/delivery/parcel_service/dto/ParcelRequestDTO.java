package org.delivery.parcel_service.dto;

import lombok.Data;
import org.delivery.parcel_service.domain.entity.ParcelStatus;

@Data
public class ParcelRequestDTO {
    private Double weight;
    private String deliveryAddress;
    private String zoneId;
    private Integer senderId;
    private String senderName;
    private String senderPhone;
    private String clientEmail; // تأكدي باللي هاد السمية هي اللي فـ Postman
    private ParcelStatus status;
}