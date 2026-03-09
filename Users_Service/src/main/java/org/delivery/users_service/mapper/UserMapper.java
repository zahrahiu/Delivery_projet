package org.delivery.users_service.mapper;

import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.entities.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    // تحويل من DTO إلى Entity
    public UserProfile toEntity(UserRequestDTO dto) {
        if (dto == null) return null;

        UserProfile entity = new UserProfile();
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setCni(dto.getCni());
        entity.setZone(dto.getZone());
        entity.setAddress(dto.getAddress());
        entity.setVehicleType(dto.getVehicleType());
        entity.setMatricule(dto.getMatricule());
        entity.setPermisNumber(dto.getPermisNumber());
        entity.setRole(dto.getRole());

        // كلمة السر كنشفرها في السيرفس ماشي هنا (باش يبقى المابر نظيف)
        return entity;
    }

    // تحويل من Entity إلى DTO
    public UserResponseDTO toDTO(UserProfile entity) {
        if (entity == null) return null;

        UserResponseDTO dto = new UserResponseDTO();
        dto.setUserId(entity.getUserId());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setCni(entity.getCni());
        dto.setZone(entity.getZone());
        dto.setAddress(entity.getAddress());
        dto.setVehicleType(entity.getVehicleType());
        dto.setMatricule(entity.getMatricule());
        dto.setPermisNumber(entity.getPermisNumber());
        dto.setRole(entity.getRole());

        return dto;
    }
}