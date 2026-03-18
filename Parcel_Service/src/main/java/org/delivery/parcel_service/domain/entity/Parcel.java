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

    // كود التتبع (مثلاً: PR-123456)
    @Column(unique = true, nullable = false)
    private String trackingNumber;

    private Double weight;
    private String deliveryAddress;
    private String zoneId; // باش نحددو المنطقة اللي فيها الطرد

    // بيانات الزبون (هنا كاين السر: هاد الداتا غتجي من Kafka من Users_Service)
    private Integer senderId;
    private String senderName;
    private String senderPhone;

    @Enumerated(EnumType.STRING)
    private ParcelStatus status;

    private String assignedLivreurId; // زدنا هادي
}