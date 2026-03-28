package org.delivery.parcel_service.mapper;

import org.delivery.parcel_service.domain.entity.Parcel;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.dto.ParcelRequestDTO;
import org.delivery.parcel_service.dto.ParcelResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class ParcelMapper {



    public Parcel toEntity(ParcelRequestDTO dto) {
        return Parcel.builder()
                .weight(dto.getWeight())
                .deliveryAddress(dto.getDeliveryAddress())
                .zoneId(dto.getZoneId())
                .senderId(dto.getSenderId())
                .senderName(dto.getSenderName())
                .senderPhone(dto.getSenderPhone())
                .senderEmail(dto.getClientEmail())
                .status(ParcelStatus.PENDING)
                .build();
    }

    public ParcelResponseDTO toResponse(Parcel parcel) {
        ParcelResponseDTO dto = new ParcelResponseDTO();
        dto.setId(parcel.getId());
        dto.setTrackingNumber(parcel.getTrackingNumber());
        dto.setWeight(parcel.getWeight());
        dto.setDeliveryAddress(parcel.getDeliveryAddress());

        // تعديل هنا باش ياخد الداتا الحقيقية من الـ Entity
        dto.setSenderName(parcel.getSenderName() != null ? parcel.getSenderName() : "Unknown");
        dto.setSenderPhone(parcel.getSenderPhone() != null ? parcel.getSenderPhone() : "N/A");

        // زيدي هاد السطر باش Node.js يلقى الإيميل:
        dto.setClientEmail(parcel.getSenderEmail());

        dto.setStatus(parcel.getStatus() != null ? parcel.getStatus().name() : "PENDING");
        return dto;
    }
}