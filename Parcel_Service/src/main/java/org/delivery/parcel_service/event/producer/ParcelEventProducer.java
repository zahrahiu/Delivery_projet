package org.delivery.parcel_service.event.producer;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ParcelEventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Async // دابا هاد الميتود غتخدم في الخلفية
    public void sendParcelCreatedEvent(Object event) {
        // نستخدمو CompletableFuture باش ما نحبسوش الـ Thread
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