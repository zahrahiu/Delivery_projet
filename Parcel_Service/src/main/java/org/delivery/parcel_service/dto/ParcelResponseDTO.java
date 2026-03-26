package org.delivery.parcel_service.dto;

import lombok.Data;
import org.delivery.parcel_service.domain.entity.ParcelStatus;

@Data
public class ParcelResponseDTO {
    private Long id;
    private String trackingNumber;
    private Double weight;
    private String deliveryAddress;
    private String senderName;
    private String senderPhone;
    private String clientEmail; // ضروري تزيديه هنا باش يبان فـ Kafka
    private String status;
}