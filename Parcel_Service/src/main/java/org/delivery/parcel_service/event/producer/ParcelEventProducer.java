package org.delivery.parcel_service.event.producer;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class ParcelEventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    // ✅ Constructeur manuel (sans Lombok)
    public ParcelEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Async
    public void sendParcelCreatedEvent(Object event) {
        kafkaTemplate.send("parcel-events", event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        System.out.println("✅ Event sent successfully");
                    } else {
                        System.err.println("❌ Failed to send event: " + ex.getMessage());
                    }
                });
    }
}