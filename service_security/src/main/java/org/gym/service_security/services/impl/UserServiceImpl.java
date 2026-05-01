package org.gym.service_security.services.impl;


import jakarta.transaction.Transactional;
import org.gym.service_security.dto.UserRequestDTO;
import org.gym.service_security.dto.UserResponseDTO;
import org.gym.service_security.entities.Role;
import org.gym.service_security.entities.User;
import org.gym.service_security.mappers.UserMapper;
import org.gym.service_security.repository.RoleRepository;
import org.gym.service_security.repository.UserRepository;
import org.gym.service_security.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           UserMapper userMapper,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponseDTO createUser(UserRequestDTO request) {
        if(userRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));


        user.setActive(request.getActive());
        user.setFirstLogin(request.isFirstLogin());

        if (request.getRole() != null) {
            Set<Role> roles = request.getRole().stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new RuntimeException("Role non trouvé: " + roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        return userMapper.Entity_to_DTO(userRepository.save(user));
    }

    private String generateRandomPassword() {
        return java.util.UUID.randomUUID().toString().substring(0, 8);
    }

    @Override
    public UserResponseDTO getUserById(Integer id) {
        User user = userRepository.findById(id.intValue())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userMapper.Entity_to_DTO(user);
    }

    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::Entity_to_DTO)
                .toList();
    }

    @Override
    public void deleteUser(Integer id) {
        userRepository.deleteById(id.intValue());
    }

    @Override
    public UserResponseDTO assignRoleToUser(Integer userId, String roleName) {
        User user = userRepository.findById(userId.intValue())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        user.getRoles().add(role);
        userRepository.save(user); // Sauvegarder les changements

        return userMapper.Entity_to_DTO(user);
    }
    @Override
    public UserResponseDTO updateUserStatus(Integer id, Boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(active);
        User updatedUser = userRepository.save(user);

        return userMapper.Entity_to_DTO(updatedUser);
    }

    @Override
    public UserResponseDTO updateUser(Integer id, UserRequestDTO request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // تحديث المعلومات
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        // تأكدي واش الإيميل تبدل ومستعملش من طرف مستخدم آخر
        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email déjà utilisé");
            }
            user.setEmail(request.getEmail());
        }

        // إلا صيفطتي باسورد جديد، هاشيه وحفظيه
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User savedUser = userRepository.save(user);
        return userMapper.Entity_to_DTO(savedUser);
    }
}