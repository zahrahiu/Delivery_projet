package org.delivery.users_service.mapper;

import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.entities.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    // RequestDTO -> Entity
    UserProfile toEntity(UserRequestDTO dto);

    // Entity -> ResponseDTO
    @Mapping(source = "role", target = "role") // RoleType -> String
    UserResponseDTO toDTO(UserProfile entity);
}