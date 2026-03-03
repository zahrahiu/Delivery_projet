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
        // 1. تحضير الطلب للسيكورتي سيرفيس (Plain Password)
        // السيكورتي سيرفيس هو اللي غيشفر الباسورد عندو فالداتابيز ديالو
        Map<String, Object> securityReq = new HashMap<>();
        securityReq.put("firstName", request.getFirstName());
        securityReq.put("lastName", request.getLastName());
        securityReq.put("email", request.getEmail());
        securityReq.put("password", request.getPassword());

        // تحويل الـ Enum لـ String باش ميبقاش مشكل فالـ JSON
        String roleName = (request.getRole() != null) ? request.getRole().name() : "DISPATCHER";
        securityReq.put("role", Collections.singleton(roleName));

        // 2. مناداة السيكورتي سيرفيس
        Map<String, Object> securityResponse = securityClient.createAccount(securityReq);

        // استخراج الـ ID اللي رجع لينا (تأكدي أن السيكورتي سيرفيس كيرجع حقل سميتو "id" أو "userId")
        Integer generatedUserId = (Integer) securityResponse.get("id");
        if (generatedUserId == null) generatedUserId = (Integer) securityResponse.get("userId");

        // 3. حفظ البروفيل فالداتابيز المحلية مع تشفير الباسورد
        UserProfile profile = mapper.toEntity(request);
        profile.setUserId(generatedUserId);

        if (request.getPassword() != null) {
            profile.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        UserProfile savedProfile = repository.save(profile);
        return mapper.toDTO(savedProfile);
    }

    @Override
    @Transactional
    public UserResponseDTO updateUserProfile(Integer id, UserRequestDTO request) {
        // 1. جلب البروفيل الحالي
        UserProfile existingProfile = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dispatcher non trouvé ID: " + id));

        // 2. تحديث السيكورتي سيرفيس (عبر الـ userId المخزن سابقا)
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
            throw new RuntimeException("Erreur de synchronisation avec Security-Service: " + e.getMessage());
        }

        // 3. تحديث معلومات البروفيل محليا
        existingProfile.setFirstName(request.getFirstName());
        existingProfile.setLastName(request.getLastName());
        existingProfile.setEmail(request.getEmail());
        existingProfile.setPhone(request.getPhone());
        existingProfile.setCni(request.getCni());
        existingProfile.setZone(request.getZone());
        existingProfile.setAddress(request.getAddress());

        // إذا تم تغيير الباسورد، نشفروه محليا أيضا
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            existingProfile.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        UserProfile updatedProfile = repository.save(existingProfile);
        return mapper.toDTO(updatedProfile);
    }

    @Override
    public UserResponseDTO getUserProfile(Integer id) {
        UserProfile profile = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("UserProfile not found ID: " + id));
        return mapper.toDTO(profile);
    }

    @Override
    public List<UserResponseDTO> getAllProfiles() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .toList();
    }

    @Override
    public void deleteProfile(Integer id) {
        if (!repository.existsById(id)) throw new NoSuchElementException("ID introuvable: " + id);
        repository.deleteById(id);
    }
}