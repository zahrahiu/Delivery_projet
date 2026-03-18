package org.delivery.parcel_service.event.consumer;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class UserEvent {
    private Integer userId;
    private String fullName;
    private String phone;
}