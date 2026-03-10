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
    private String password;
    private String phone; // خاص تكون phone ماشي phoneNumber باش تفهمها React
    private String cni;
    private String zone;  // خاص تكون zone ماشي city
    private String address;
    // في UserProfile.java
    private String profileImageUrl;
    private String vehicleType;  // Moto, Voiture, etc.
    private String matricule;
    private String permisNumber;

    @Enumerated(EnumType.STRING)
    private RoleType role;
}