package org.delivery.parcel_service.dto;

import jakarta.persistence.Column;
import lombok.Data;
import org.delivery.parcel_service.domain.entity.ParcelStatus;

import java.time.LocalDateTime;

@Data
public class ParcelResponseDTO {
    private Long id;
    private String trackingNumber;
    private Double weight;
    private String deliveryAddress;
    private String zoneId;  // ✅ أضف هاد السطر
    private String cityName;
    private String senderName;
    private String actionType;
    private String senderPhone;
    private String clientEmail; // ضروري تزيديه هنا باش يبان فـ Kafka
    private String status;
    private String assignedLivreurId;
    private Double latitude;
    private Double longitude;
    private String clientName;      // اسم العميل المستلم
    @Column(columnDefinition = "TEXT")
    private String signature;        // التوقيع (Base64)
    private LocalDateTime deliveredAt; // تاريخ التسليم
    private String deliveryNotes;
}