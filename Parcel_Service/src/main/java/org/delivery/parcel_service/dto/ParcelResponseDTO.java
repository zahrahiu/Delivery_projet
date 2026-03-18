package org.delivery.parcel_service.dto;

import lombok.Data;
import org.delivery.parcel_service.domain.entity.ParcelStatus;

@Data// هاد الـ DTO كنستعملوه ملي بغينا نرجعو معلومات الطرد للـ User
public class ParcelResponseDTO {
    Long id;
    String trackingNumber;
    Double weight;
    String deliveryAddress;
    String senderName;
    String senderPhone;
    ParcelStatus status;
}