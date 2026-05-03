package org.delivery.parcel_service.mapper;

import org.delivery.parcel_service.domain.entity.Parcel;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.dto.ParcelRequestDTO;
import org.delivery.parcel_service.dto.ParcelResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class ParcelMapper {



    public Parcel toEntity(ParcelRequestDTO dto) {
        Parcel parcel = new Parcel(); // استعمال الـ Constructor العادي
        parcel.setWeight(dto.getWeight());
        parcel.setDeliveryAddress(dto.getDeliveryAddress());
        parcel.setZoneId(dto.getZoneId());
        parcel.setSenderId(dto.getSenderId());
        parcel.setSenderName(dto.getSenderName());
        parcel.setCityName(dto.getCityName());
        parcel.setClientName(dto.getClientName());
        parcel.setDeliveryNotes(dto.getDeliveryNotes());
        parcel.setSignature(dto.getSignature());
        parcel.setSenderPhone(dto.getSenderPhone());
        parcel.setLatitude(dto.getLatitude());
        parcel.setActionType(dto.getActionType());
        parcel.setLongitude(dto.getLongitude());
        parcel.setTrackingNumber(dto.getTrackingNumber());
        parcel.setClientEmail(dto.getClientEmail());
        parcel.setStatus(ParcelStatus.PENDING); // استعمال الـ Enum مباشرة
        return parcel;
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