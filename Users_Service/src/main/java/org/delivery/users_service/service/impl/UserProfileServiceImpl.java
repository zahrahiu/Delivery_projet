package org.delivery.users_service.service.impl;

import jakarta.transaction.Transactional;
import org.delivery.users_service.client.SecurityClient;
import org.delivery.users_service.DTO.UserRequestDTO;
import org.delivery.users_service.DTO.UserResponseDTO;
import org.delivery.users_service.entities.UserProfile;
import org.delivery.users_service.mapper.UserMapper;
import org.delivery.users_service.repository.UserRepository;
import org.delivery.users_service.service.UserProfileService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository repository;
    private final SecurityClient securityClient;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;

    public UserProfileServiceImpl(UserRepository repository, SecurityClient securityClient, UserMapper mapper, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.securityClient = securityClient;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponseDTO createUserProfile(UserRequestDTO request) {
        // 1. مناداة السيكورتي سيرفيس لإنشاء الحساب
        Map<String, Object> securityReq = new HashMap<>();
        securityReq.put("firstName", request.getFirstName());
        securityReq.put("lastName", request.getLastName());
        securityReq.put("email", request.getEmail());
        securityReq.put("password", request.getPassword());
        securityReq.put("role", Collections.singleton((request.getRole() != null) ? request.getRole().name() : "LIVREUR"));

        Map<String, Object> securityResponse = securityClient.createAccount(securityReq);
        Integer generatedUserId = (Integer) securityResponse.get("id");
        if (generatedUserId == null) generatedUserId = (Integer) securityResponse.get("userId");

        // 2. التحويل باستخدام المابر اليدوي
        UserProfile profile = mapper.toEntity(request);
        profile.setUserId(generatedUserId);

        // 3. تشفير الباسورد قبل الحفظ
        if (request.getPassword() != null) {
            profile.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // 4. الحفظ
        UserProfile savedProfile = repository.save(profile);
        return mapper.toDTO(savedProfile);
    }

    @Override
    @Transactional
    public UserResponseDTO updateUserProfile(Integer id, UserRequestDTO request) {
        UserProfile existingProfile = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User non trouvé ID: " + id));

        // 1. تحديث السيكورتي سيرفيس
        Map<String, Object> securityReq = new HashMap<>();
        securityReq.put("firstName", request.getFirstName());
        securityReq.put("lastName", request.getLastName());
        securityReq.put("email", request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            securityReq.put("password", request.getPassword());
        }

        try {
            securityClient.updateAccount(existingProfile.getUserId(), securityReq);
        } catch (Exception e) {
            throw new RuntimeException("Erreur de synchronisation: " + e.getMessage());
        }

        // 2. تحديث الحقول محليا (باستخدام المابر لتحديث القيم)
        existingProfile.setFirstName(request.getFirstName());
        existingProfile.setLastName(request.getLastName());
        existingProfile.setEmail(request.getEmail());
        existingProfile.setPhone(request.getPhone());
        existingProfile.setCni(request.getCni());
        existingProfile.setZone(request.getZone());
        existingProfile.setAddress(request.getAddress());
        existingProfile.setVehicleType(request.getVehicleType());
        existingProfile.setMatricule(request.getMatricule());
        existingProfile.setPermisNumber(request.getPermisNumber());
        existingProfile.setRole(request.getRole());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            existingProfile.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return mapper.toDTO(repository.save(existingProfile));
    }

    @Override
    public UserResponseDTO getUserProfile(Integer id) {
        return mapper.toDTO(repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found ID: " + id)));
    }

    @Override
    public List<UserResponseDTO> getAllProfiles() {
        return repository.findAll().stream().map(mapper::toDTO).toList();
    }

    @Override
    public void deleteProfile(Integer id) {
        if (!repository.existsById(id)) throw new NoSuchElementException("ID introuvable");
        repository.deleteById(id);
    }
}