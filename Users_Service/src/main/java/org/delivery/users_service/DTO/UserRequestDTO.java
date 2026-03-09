package org.delivery.users_service.DTO;


import lombok.Data;
import org.delivery.users_service.entities.RoleType;

@Data
public class UserRequestDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone; // خاص تكون phone ماشي phoneNumber باش تفهمها React
    private String cni;
    private String zone;  // خاص تكون zone ماشي city
    private String address;
    private RoleType role;
    private String vehicleType;
    private String matricule;
    private String permisNumber;
}