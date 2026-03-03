package org.delivery.users_service.entities;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor

public class UserProfile {
    @Id
    private Integer userId;
    private String firstName;
    private String lastName;
    private String email;
    private String cni;
    private String phoneNumber;
    private String address;
    private String city;

    @Enumerated(EnumType.STRING)
    private RoleType role;
}