package org.delivery.users_service.service.impl;

import jakarta.transaction.Transactional;
import org.delivery.users_service.client.SecurityClient;
import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.entities.UserProfile;
import org.delivery.users_service.mapper.UserMapper;
import org.delivery.users_service.repository.UserRepository;
import org.delivery.users_service.service.UserProfileService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;



import java.util.*;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository repository;
    private final SecurityClient securityClient;
    private final UserMapper mapper; // inject Mapper

    public UserProfileServiceImpl(UserRepository repository, SecurityClient securityClient, UserMapper mapper) {
        this.repository = repository;
        this.securityClient = securityClient;
        this.mapper = mapper;
    }

    @Override
    public UserResponseDTO createUserProfile(UserRequestDTO request) {
        Map<String, Object> securityReq = new HashMap<>();
        securityReq.put("firstName", request.getFirstName());
        securityReq.put("lastName", request.getLastName());
        securityReq.put("email", request.getEmail());
        securityReq.put("password", request.getPassword());


        securityReq.put("role", Collections.singleton(request.getRole().name()));

        // 2. تعييط لـ Security Service عبر Feign
        // الـ Interceptor اللي زدنا غيتكلف بـ Token أوتوماتيكياً
        Map<String, Object> securityResponse = securityClient.createAccount(securityReq);

        // استخراج الـ ID اللي رجع من السيكورتي
        Integer generatedId = (Integer) securityResponse.get("id");

        // 3. كملي الخدمة فـ السيرفيس ديالك
        UserProfile profile = mapper.toEntity(request);
        profile.setUserId(generatedId);

        UserProfile savedProfile = repository.save(profile);
        return mapper.toDTO(savedProfile);
    }

    @Override
    public UserResponseDTO getUserProfile(Integer id) {
        UserProfile profile = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("UserProfile not found with id: " + id));
        return mapper.toDTO(profile);
    }

    @Override
    public List<UserResponseDTO> getAllProfiles() {
        return repository.findAll()
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteProfile(Integer id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Cannot delete. UserProfile not found with id: " + id);
        }
        repository.deleteById(id);
    }
}