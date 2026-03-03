package org.delivery.users_service.DTO;


import lombok.Data;

@Data
public class UserResponseDTO {
    private Integer userId;
    private String firstName;
    private String lastName;
    private String email;
    private String cni;
    private String phoneNumber;
    private String role;
}