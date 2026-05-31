package org.delivery.parcel_service.event.consumer;

import org.delivery.parcel_service.domain.entity.Parcel;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.domain.repository.ParcelRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class DeliveryAssignmentConsumer {

    private final ParcelRepository parcelRepository;

    public DeliveryAssignmentConsumer(ParcelRepository parcelRepository) {
        this.parcelRepository = parcelRepository;
    }

    // 🔥 استقبل Map مباشرة - بدون ObjectMapper
    @KafkaListener(topics = "delivery-assignments", groupId = "parcel-group")
    @Transactional
    public void consumeAssignmentEvent(Map<String, Object> event) {
        try {
            System.out.println("========== 📥 KAFKA EVENT RECEIVED ==========");
            System.out.println("Event: " + event);

            String trackingNumber = (String) event.get("trackingNumber");
            String livreurId = event.get("livreurId") != null ? event.get("livreurId").toString() : null;
            String action = (String) event.get("action");

            if (trackingNumber == null) {
                System.err.println("❌ No trackingNumber in event!");
                return;
            }

            System.out.println("🔍 Looking for parcel: " + trackingNumber);

            Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber).orElse(null);

            if (parcel == null) {
                System.err.println("❌ Parcel NOT FOUND: " + trackingNumber);
                return;
            }

            System.out.println("✅ Parcel found: ID=" + parcel.getId() + ", Current Status=" + parcel.getStatus());

            if ("ASSIGN".equals(action) && livreurId != null) {
                parcel.setAssignedLivreurId(livreurId);
                parcel.setStatus(ParcelStatus.ASSIGNED);
                System.out.println("✅ Assigned to livreur: " + livreurId);
            } else if ("UNASSIGN".equals(action)) {
                parcel.setAssignedLivreurId(null);
                parcel.setStatus(ParcelStatus.PENDING);
                System.out.println("✅ Unassigned");
            } else {
                System.out.println("⚠️ Unknown action: " + action);
                return;
            }

            Parcel saved = parcelRepository.save(parcel);
            System.out.println("✅ Parcel saved! New Status: " + saved.getStatus());
            System.out.println("✅ AssignedLivreurId: " + saved.getAssignedLivreurId());
            System.out.println("============================================");

        } catch (Exception e) {
            System.err.println("❌ Error processing event: " + e.getMessage());
            e.printStackTrace();
        }
    }
}