package org.delivery.parcel_service.service.impl;

import org.apache.kafka.common.errors.ResourceNotFoundException;
import org.delivery.parcel_service.domain.entity.Parcel;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.domain.repository.ParcelRepository;
import org.delivery.parcel_service.dto.ClientUpdateRequest;
import org.delivery.parcel_service.dto.DeliveryConfirmationRequest;
import org.delivery.parcel_service.dto.ParcelRequestDTO;
import org.delivery.parcel_service.dto.ParcelResponseDTO;
import org.delivery.parcel_service.event.producer.ParcelEventProducer;
import org.delivery.parcel_service.mapper.ParcelMapper;
import org.delivery.parcel_service.service.ParcelService;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ParcelServiceImpl implements ParcelService {

    private final ParcelRepository parcelRepository;
    private final ParcelMapper parcelMapper;
    private final ParcelEventProducer parcelEventProducer;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ParcelServiceImpl(ParcelRepository parcelRepository, ParcelMapper parcelMapper, ParcelEventProducer parcelEventProducer, KafkaTemplate<String, Object> kafkaTemplate) {
        this.parcelRepository = parcelRepository;
        this.parcelMapper = parcelMapper;
        this.parcelEventProducer = parcelEventProducer;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Override
    @Transactional
    public ParcelResponseDTO createParcel(ParcelRequestDTO dto) {
        Parcel parcel = parcelMapper.toEntity(dto);
        parcel.setStatus(ParcelStatus.PENDING);
        parcel.setTrackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        Parcel savedParcel = parcelRepository.save(parcel);

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

        // 1. إيلا كان Admin أو Dispatcher يشوف كولشي
        if (authorities.contains("ROLE_DISPATCHER") || authorities.contains("ROLE_ADMIN")) {
            return parcelRepository.findAll().stream()
                    .map(parcelMapper::toResponse).toList();
        }

        // نجبدو الـ userId من الـ Token (نفس الطريقة اللي درتي لـ Client)
        Object userIdObj = jwt.getTokenAttributes().get("userId");
        if (userIdObj == null) return List.of();
        String userId = userIdObj.toString();

        // 2. إيلا كان Livreur يشوف غير اللي Assigned ليه
        if (authorities.contains("ROLE_LIVREUR")) {
            // تأكدي بلي عندك هاد الدالة فـ Repository (غادي نزيدوها لتحت)
            return parcelRepository.findByAssignedLivreurId(userId).stream()
                    .map(parcelMapper::toResponse).toList();
        }


        if (authorities.contains("ROLE_CLIENT")) {
            // نجبدو الإيميل من الـ sub (Subject) ديال الـ JWT
            String clientEmail = jwt.getTokenAttributes().get("sub").toString();

            // دابا كنقلبو بـ الإيميل اللي دخل الـ Dispatcher فـ الفورم
            return parcelRepository.findByClientEmail(clientEmail).stream()
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

    @Override
    public ParcelResponseDTO getParcelById(Long id) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found with id: " + id));
        return parcelMapper.toResponse(parcel);
    }

    @Override
    @Transactional
    public void confirmDelivery(Long id, DeliveryConfirmationRequest request) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found with id: " + id));

        // تحديث الحالة
        parcel.setStatus(ParcelStatus.DELIVERED);

        // تخزين معلومات التسليم
        parcel.setClientName(request.getClientName());
        parcel.setSignature(request.getSignature());
        parcel.setDeliveryNotes(request.getNotes());
        parcel.setDeliveredAt(LocalDateTime.now());

        parcelRepository.save(parcel);

        System.out.println("✅ Livraison confirmée: " + parcel.getTrackingNumber());
        System.out.println("   Client: " + request.getClientName());
    }

    public void reportProblem(Long id, String reason) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found"));

        parcel.setStatus(ParcelStatus.RETURNED); // Hna t-beddel status
        parcel.setDeliveryNotes(reason); // Khzen l-mouchkil f notes
        parcelRepository.save(parcel);

    }

    // Zid had l method f ParcelServiceImpl (t7t l KafkaTemplate)
    private void sendNotificationToKafka(Parcel parcel, String actionType, String oldAddress, String oldPhone, String newAddress, String newPhone) {
        try {
            // بناء رسالة التفاصيل
            String changes = "";
            if (actionType.equals("INFO_UPDATED")) {
                if (!oldAddress.equals(newAddress) && !oldPhone.equals(newPhone)) {
                    changes = "العنوان ورقم الهاتف";
                } else if (!oldAddress.equals(newAddress)) {
                    changes = "العنوان";
                } else if (!oldPhone.equals(newPhone)) {
                    changes = "رقم الهاتف";
                }
            }

            Map<String, Object> event = new HashMap<>();
            event.put("parcelId", parcel.getId());
            event.put("trackingNumber", parcel.getTrackingNumber());
            event.put("clientEmail", parcel.getClientEmail());
            event.put("clientName", parcel.getSenderName());
            event.put("actionType", actionType);
            event.put("changes", changes);  // 🔥 جديد: شنو تبدل
            event.put("oldAddress", oldAddress);
            event.put("newAddress", newAddress);
            event.put("oldPhone", oldPhone);
            event.put("newPhone", newPhone);
            event.put("assignedLivreurId", parcel.getAssignedLivreurId());

            kafkaTemplate.send("parcel-update-events", event);
            System.out.println("✅ Event sent to Kafka: " + actionType + " - Changes: " + changes);
        } catch (Exception e) {
            System.err.println("❌ Failed to send Kafka event: " + e.getMessage());
        }
    }


    @Override
    @Transactional
    public void updateClientParcelInfo(Long id, ClientUpdateRequest request) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));

        // حفظ القيم القديمة
        String oldAddress = parcel.getDeliveryAddress();
        String oldPhone = parcel.getSenderPhone();
        String newAddress = oldAddress;
        String newPhone = oldPhone;

        if (request.getDeliveryAddress() != null && !request.getDeliveryAddress().isEmpty()) {
            parcel.setDeliveryAddress(request.getDeliveryAddress());
            newAddress = request.getDeliveryAddress();
        }
        if (request.getSenderPhone() != null && !request.getSenderPhone().isEmpty()) {
            parcel.setSenderPhone(request.getSenderPhone());
            newPhone = request.getSenderPhone();
        }

        parcelRepository.save(parcel);
        System.out.println("✅ Client updated parcel: " + parcel.getTrackingNumber());

        // 🔥 بعث إشعار مع التفاصيل
        sendNotificationToKafka(parcel, "INFO_UPDATED", oldAddress, oldPhone, newAddress, newPhone);
    }


    @Override
    @Transactional
    public void cancelParcelByClient(Long id) {
        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found with id: " + id));

        if (parcel.getStatus() == ParcelStatus.DELIVERED) {
            throw new RuntimeException("Impossible d'annuler un colis déjà livré");
        }
        if (parcel.getStatus() == ParcelStatus.IN_TRANSIT) {
            throw new RuntimeException("Impossible d'annuler un colis déjà en transit, contactez le support");
        }
        if (parcel.getStatus() == ParcelStatus.RETURNED) {
            throw new RuntimeException("Ce colis est déjà retourné");
        }

        parcel.setStatus(ParcelStatus.CANCELLED);
        parcelRepository.save(parcel);

        System.out.println("✅ Client cancelled parcel: " + parcel.getTrackingNumber());

        // 🔥 للإلغاء، نبعثو نفس القيم القديمة والجديدة (نفس القيم)
        sendNotificationToKafka(parcel, "CANCELLED",
                parcel.getDeliveryAddress(),
                parcel.getSenderPhone(),
                parcel.getDeliveryAddress(),
                parcel.getSenderPhone());
    }




}