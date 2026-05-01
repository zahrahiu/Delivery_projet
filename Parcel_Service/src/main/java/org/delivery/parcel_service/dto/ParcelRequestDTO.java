package org.delivery.parcel_service.dto;

import jakarta.persistence.Column;
import lombok.Data;
import org.delivery.parcel_service.domain.entity.ParcelStatus;

import java.time.LocalDateTime;

@Data
public class ParcelRequestDTO {
    private Double weight;
    private String deliveryAddress;
    private String trackingNumber;
    private String actionType;

    private String zoneId;
    private Integer senderId;
    private String senderName;
    private String cityName;

    private String senderPhone;
    private String clientEmail; // تأكدي باللي هاد السمية هي اللي فـ Postman
    private ParcelStatus status;
    private String assignedLivreurId;
    private Double latitude;
    private Double longitude;
    private String clientName;      // اسم العميل المستلم
    @Column(columnDefinition = "TEXT")
    private String signature;        // التوقيع (Base64)
    private LocalDateTime deliveredAt; // تاريخ التسليم
    private String deliveryNotes;
}