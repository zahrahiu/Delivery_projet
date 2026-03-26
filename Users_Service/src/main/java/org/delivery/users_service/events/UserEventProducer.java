package org.delivery.users_service.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate; // زيدي هاد السطر ضروري
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper; // ضروري تزيدي هادا

    public void sendUserCreatedEvent(Map<String, Object> userData) {
        try {
            // كتحولي الـ Map لـ String (JSON)
            String jsonMessage = objectMapper.writeValueAsString(userData);

            // دابا صيفطي الـ String
            kafkaTemplate.send("user-creation-topic", jsonMessage);

            System.out.println("✅ Event sent to Kafka: " + jsonMessage);
        } catch (JsonProcessingException e) {
            System.err.println("❌ Error serializing user data: " + e.getMessage());
        }
    }
}