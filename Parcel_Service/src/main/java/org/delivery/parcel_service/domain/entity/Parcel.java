package org.delivery.parcel_service.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Parcel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String trackingNumber;

    private Double weight;
    private String deliveryAddress;
    private String zoneId;
    private String actionType;
    private Integer senderId;
    private String senderName;
    private String senderPhone;
    // داخل Parcel.java
    private String clientEmail;
    @Enumerated(EnumType.STRING)
    private ParcelStatus status;
    // Parcel.java
    private String cityName; // نزيدو هاد السطر
    private String assignedLivreurId;


    private Double latitude;   // إحداثيات GPS
    private Double longitude;  // إحداثيات GPS

    // أضف هاد الحقول تحت `assignedLivreurId`

    private String clientName;      // اسم العميل المستلم
    @Column(columnDefinition = "TEXT")
    private String signature;        // التوقيع (Base64)
    private LocalDateTime deliveredAt; // تاريخ التسليم
    private String deliveryNotes;     // ملاحظات التسليم
}