package org.delivery.parcel_service.service.impl;

import lombok.RequiredArgsConstructor;
import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.delivery.parcel_service.domain.entity.Parcel;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.domain.repository.ParcelRepository;
import org.delivery.parcel_service.dto.ParcelRequestDTO;
import org.delivery.parcel_service.dto.ParcelResponseDTO;
import org.delivery.parcel_service.event.producer.ParcelEventProducer;
import org.delivery.parcel_service.mapper.ParcelMapper;
import org.delivery.parcel_service.service.ParcelService;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParcelServiceImpl implements ParcelService {

    private final ParcelRepository parcelRepository;
    private final ParcelMapper parcelMapper;
    private final ParcelEventProducer parcelEventProducer;

    @Override
    @Transactional
    public ParcelResponseDTO createParcel(ParcelRequestDTO dto) {
        Parcel parcel = parcelMapper.toEntity(dto);
        parcel.setStatus(ParcelStatus.PENDING);
        parcel.setTrackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Parcel savedParcel = parcelRepository.save(parcel);

        // كنصيفطو لـ Kafka بلا ما نحبسوا الـ Transaction حيت درنا @Async فـ الـ Producer
        try {
            parcelEventProducer.sendParcelCreatedEvent(parcelMapper.toResponse(savedParcel));
        } catch (Exception e) {
            System.err.println("Kafka logging failed but parcel saved: " + e.getMessage());
        }

        return parcelMapper.toResponse(savedParcel);
    }

    @Override
    public List<ParcelResponseDTO> getParcels(Principal principal) {
        if (!(principal instanceof JwtAuthenticationToken jwt)) return List.of();

        var authorities = jwt.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .toList();

        if (authorities.contains("ROLE_DISPATCHER") || authorities.contains("ROLE_ADMIN")) {
            return parcelRepository.findAll().stream()
                    .map(parcelMapper::toResponse).toList();
        }
        // Client كيشوف غير طرودو
        Object userIdObj = jwt.getTokenAttributes().get("userId");
        if (userIdObj != null) {
            Integer userId = Integer.parseInt(userIdObj.toString());
            return parcelRepository.findBySenderId(userId).stream()
                    .map(parcelMapper::toResponse).toList();
        }

        return List.of();
    }

    @Override
    public void assignToLivreur(Long id, String livreurId) {
        Parcel parcel = parcelRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        parcel.setAssignedLivreurId(livreurId);
        parcel.setStatus(ParcelStatus.IN_TRANSIT);
        parcelRepository.save(parcel);
    }

    @Override
    public ParcelResponseDTO getParcelByTrackingNumber(String trackingNumber) {
        return parcelRepository.findByTrackingNumber(trackingNumber)
                .map(parcelMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));
    }

    @Override
    @Transactional
    public void updateStatus(Long id, ParcelStatus status) {
        Parcel parcel = parcelRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        parcel.setStatus(status);
        parcelRepository.save(parcel);
    }

    @Override
    public List<ParcelResponseDTO> getParcelsByZone(String zoneId) {
        return parcelRepository.findByZoneId(zoneId).stream().map(parcelMapper::toResponse).toList();
    }

    @Transactional
    public ParcelResponseDTO updateParcel(Long id, ParcelRequestDTO dto) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));

        parcel.setWeight(dto.getWeight());
        parcel.setDeliveryAddress(dto.getDeliveryAddress());
        parcel.setZoneId(dto.getZoneId());

        parcel.setSenderId(dto.getSenderId());
        parcel.setSenderName(dto.getSenderName());
        parcel.setSenderPhone(dto.getSenderPhone());

        if (dto.getStatus() != null) {
            parcel.setStatus(dto.getStatus());
        }

        return parcelMapper.toResponse(parcelRepository.save(parcel));
    }

    public void deleteParcel(Long id) {
        Parcel parcel = parcelRepository.findById(id).orElseThrow();
        parcelRepository.delete(parcel);
    }
}