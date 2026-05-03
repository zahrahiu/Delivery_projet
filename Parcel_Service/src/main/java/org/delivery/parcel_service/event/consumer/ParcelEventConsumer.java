package org.delivery.parcel_service.event.consumer;

import org.delivery.parcel_service.domain.repository.ParcelRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class ParcelEventConsumer {
    private final ParcelRepository repository;

    // ✅ Constructeur manuel (sans Lombok)
    public ParcelEventConsumer(ParcelRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "user-updates", groupId = "parcel-group")
    public void consumeUserUpdate(UserEvent event) {
        var parcels = repository.findBySenderId(event.getUserId());
        parcels.forEach(p -> {
            p.setSenderName(event.getFullName());
            p.setSenderPhone(event.getPhone());
            repository.save(p);
        });
    }
}