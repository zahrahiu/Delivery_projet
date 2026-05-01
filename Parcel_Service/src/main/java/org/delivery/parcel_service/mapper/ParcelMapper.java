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
                .cityName(dto.getCityName())
                .clientName(dto.getClientName())
                .deliveryNotes(dto.getDeliveryNotes())
                .signature(dto.getSignature())
                .senderPhone(dto.getSenderPhone())
                .latitude(dto.getLatitude())
                .actionType(dto.getActionType())
                .longitude(dto.getLongitude())
                .trackingNumber(dto.getTrackingNumber())
                .clientEmail(dto.getClientEmail()) // رديها clientEmail
                .status(ParcelStatus.PENDING)
                .build();
    }

    public ParcelResponseDTO toResponse(Parcel parcel) {
        ParcelResponseDTO dto = new ParcelResponseDTO();
        dto.setId(parcel.getId());
        dto.setTrackingNumber(parcel.getTrackingNumber());
        dto.setWeight(parcel.getWeight());
        dto.setDeliveryAddress(parcel.getDeliveryAddress());
dto.setZoneId(parcel.getZoneId());
dto.setCityName(parcel.getCityName());
        // تعديل هنا باش ياخد الداتا الحقيقية من الـ Entity
        dto.setSenderName(parcel.getSenderName() != null ? parcel.getSenderName() : "Unknown");
        dto.setSenderPhone(parcel.getSenderPhone() != null ? parcel.getSenderPhone() : "N/A");
        dto.setLatitude(parcel.getLatitude());
        dto.setLongitude(parcel.getLongitude());
        dto.setActionType(parcel.getActionType());
        dto.setDeliveryNotes(parcel.getDeliveryNotes());
        dto.setSignature(parcel.getSignature());
        dto.setDeliveryAddress(parcel.getDeliveryAddress());
        dto.setClientName(parcel.getClientName());


        // زيدي هاد السطر باش Node.js يلقى الإيميل:
        dto.setClientEmail(parcel.getClientEmail()); // رديها clientEmail

        dto.setAssignedLivreurId(parcel.getAssignedLivreurId());

        dto.setStatus(parcel.getStatus() != null ? parcel.getStatus().name() : "PENDING");
        return dto;
    }
}