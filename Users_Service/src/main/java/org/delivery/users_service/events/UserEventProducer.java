package org.delivery.users_service.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendUserCreatedEvent(Map<String, Object> userData) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(userData);
            kafkaTemplate.send("user-creation-topic", jsonMessage);
            System.out.println("✅ Event sent to Kafka: " + jsonMessage);
        } catch (JsonProcessingException e) {
            System.err.println("❌ Error serializing user data: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("⚠️ Kafka may not be available: " + e.getMessage());
        }
    }
}