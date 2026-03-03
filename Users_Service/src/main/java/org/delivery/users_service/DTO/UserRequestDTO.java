package org.delivery.users_service.DTO;


import lombok.Data;
import org.delivery.users_service.entities.RoleType;

@Data
public class UserRequestDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private String address;
    private String city;
    private String cni;
    private RoleType role;
}