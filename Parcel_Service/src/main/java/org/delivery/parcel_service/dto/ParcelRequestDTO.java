package org.delivery.parcel_service.dto;

import lombok.Data;

@Data// هاد الـ DTO كنستعملوه ملي بغينا نكرييو طرد جديد
public class ParcelRequestDTO{
        Integer senderId;
        Double weight;
        String deliveryAddress;
        String zoneId;
}