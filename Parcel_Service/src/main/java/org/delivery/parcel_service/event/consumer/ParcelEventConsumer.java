package org.delivery.parcel_service.event.consumer;

import lombok.RequiredArgsConstructor;
import org.delivery.parcel_service.domain.repository.ParcelRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ParcelEventConsumer {
    private final ParcelRepository repository;

    @KafkaListener(topics = "user-updates", groupId = "parcel-group")
    public void consumeUserUpdate(UserEvent event) {
        // كنلقاو كاع الطرود ديال هاد الزبون ونحدثو بياناتو (SenderName, Phone)
        var parcels = repository.findBySenderId(event.getUserId());
        parcels.forEach(p -> {
            p.setSenderName(event.getFullName());
            p.setSenderPhone(event.getPhone());
            repository.save(p);
        });
    }
}