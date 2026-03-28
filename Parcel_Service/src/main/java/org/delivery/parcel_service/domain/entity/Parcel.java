package org.delivery.parcel_service.domain.entity;

import jakarta.persistence.*;
import lombok.*;

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

    private Integer senderId;
    private String senderName;
    private String senderPhone;
    // داخل Parcel.java
    private String senderEmail;
    @Enumerated(EnumType.STRING)
    private ParcelStatus status;

    private String assignedLivreurId;
}