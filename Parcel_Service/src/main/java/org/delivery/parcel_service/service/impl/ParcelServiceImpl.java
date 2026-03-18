package org.delivery.parcel_service.service.impl;

import lombok.RequiredArgsConstructor;
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

        // 1. الحالة المبدئية
        parcel.setStatus(ParcelStatus.PENDING);
        parcel.setTrackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        // 2. المنطق: السيرفيس خاصو يخدم بـ logic ديال الـ assignment
        // تقدري تزيدي هنا call لـ service آخر أو ببساطة تركيه null حتى يجي الـ Event

        Parcel savedParcel = parcelRepository.save(parcel);

        // 3. تصيفطو للإيفينت (باش الـ Delivery_Service يعرف بلي كاين طرد جديد في ZONE-01)
        parcelEventProducer.sendParcelCreatedEvent(parcelMapper.toResponse(savedParcel));

        return parcelMapper.toResponse(savedParcel);
    }

    @Override
    public ParcelResponseDTO getParcelByTrackingNumber(String trackingNumber) {
        Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new RuntimeException("Parcel not found: " + trackingNumber));
        return parcelMapper.toResponse(parcel);
    }

    @Override
    public List<ParcelResponseDTO> getParcels(Principal principal) {
        // 1. خاصنا نعرفو الـ Role والـ ID ديال اللي داخل (تقدري تجيبيهم من الـ JWT)
        // تبسيط: الـ Principal كيعطينا السمية، والـ JWT كيعطينا الـ Roles
        boolean isAdmin = checkRole(principal, "ROLE_ADMIN");

        if (isAdmin) {
            return parcelRepository.findAll().stream()
                    .map(parcelMapper::toResponse).toList();
        } else {
            // Client: كنجيبو غير الطرود ديالو بالـ senderId
            Integer userId = getUserIdFromPrincipal(principal);
            return parcelRepository.findBySenderId(userId).stream()
                    .map(parcelMapper::toResponse).toList();
        }
    }

    @Override
    public void assignToLivreur(Long id, String livreurId) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));
        parcel.setAssignedLivreurId(livreurId);
        parcel.setStatus(ParcelStatus.IN_TRANSIT);
        parcelRepository.save(parcel);
    }

    // هادي ميتود مساعدة باش تعرفي الـ Roles
    private boolean checkRole(Principal principal, String role) {
        if (principal instanceof JwtAuthenticationToken jwt) {
            return jwt.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals(role));
        }
        return false;
    }

    // هادي ميتود مساعدة باش تجيبي الـ ID ديال الـ User
    private Integer getUserIdFromPrincipal(Principal principal) {
        if (principal instanceof JwtAuthenticationToken jwt) {
            // مفترضة أن الـ ID مخبي فـ الـ Claims ديال الـ Token
            return (Integer) jwt.getTokenAttributes().get("userId");
        }
        return null;
    }

    @Transactional
    public ParcelResponseDTO updateParcel(Long id, ParcelRequestDTO dto) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));

        parcel.setWeight(dto.getWeight());
        parcel.setDeliveryAddress(dto.getDeliveryAddress());

        return parcelMapper.toResponse(parcelRepository.save(parcel));
    }

    public void deleteParcel(Long id) {
        if (!parcelRepository.existsById(id)) {
            throw new RuntimeException("Parcel not found");
        }
        parcelRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateStatus(Long id, ParcelStatus status) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));

        parcel.setStatus(status);
        parcelRepository.save(parcel);

        // نصيحة: هنا فين خاصك تصيفطي Event جديد للـ Kafka
        // باش باقي السيرفيسات يعرفو أن الحالة تبدلات (مثلاً: Notification Service)
    }

    @Override
    public List<ParcelResponseDTO> getParcelsByZone(String zoneId) {
        return parcelRepository.findByZoneId(zoneId).stream()
                .map(parcelMapper::toResponse)
                .toList();
    }

}