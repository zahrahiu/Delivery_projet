package org.delivery.parcel_service.mapper;

import org.delivery.parcel_service.domain.entity.Parcel;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.dto.ParcelRequestDTO;
import org.delivery.parcel_service.dto.ParcelResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class ParcelMapper {

    // تحويل من DTO لـ Entity (باش نخزنو فـ DB)
    // داخل ParcelMapper.java

    public Parcel toEntity(ParcelRequestDTO dto) {
        return Parcel.builder()
                // 1. هنا كناخدو المعلومات اللي جاية من الـ Request
                .senderId(dto.getSenderId())
                .weight(dto.getWeight())
                .deliveryAddress(dto.getDeliveryAddress())
                .zoneId(dto.getZoneId())

                // 2. هاد الحقول كيبقاو null فالبداية حيت السيرفيس هو اللي كيعمرهم من بعد
                .status(ParcelStatus.PENDING)
                .build();
    }

    // داخل ParcelMapper.java
    public ParcelResponseDTO toResponse(Parcel parcel) {
        ParcelResponseDTO dto = new ParcelResponseDTO();
        dto.setId(parcel.getId());
        dto.setTrackingNumber(parcel.getTrackingNumber());
        dto.setWeight(parcel.getWeight());
        dto.setDeliveryAddress(parcel.getDeliveryAddress());
        // الـ null handling هنا كيخلي الـ Frontend ما يوقعش ليه مشكل
        dto.setSenderName(parcel.getSenderName() != null ? parcel.getSenderName() : "Unknown");
        dto.setSenderPhone(parcel.getSenderPhone() != null ? parcel.getSenderPhone() : "N/A");
        dto.setStatus(parcel.getStatus());
        return dto;
    }
}