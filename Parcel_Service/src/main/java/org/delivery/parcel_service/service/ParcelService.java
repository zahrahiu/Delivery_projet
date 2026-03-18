package org.delivery.parcel_service.service;

import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.dto.ParcelRequestDTO;
import org.delivery.parcel_service.dto.ParcelResponseDTO;

import java.security.Principal;
import java.util.List;

public interface ParcelService {
    ParcelResponseDTO createParcel(ParcelRequestDTO parcelRequestDTO);
    ParcelResponseDTO getParcelByTrackingNumber(String trackingNumber);
    List<ParcelResponseDTO> getParcels(Principal principal);
    void assignToLivreur(Long id, String livreurId); // هادي اللي ناقصة
    void deleteParcel(Long id);
    ParcelResponseDTO updateParcel(Long id, ParcelRequestDTO parcelRequestDTO);
    void updateStatus(Long id, ParcelStatus status);
    List<ParcelResponseDTO> getParcelsByZone(String zoneId);
}