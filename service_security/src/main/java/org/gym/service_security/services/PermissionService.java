package org.gym.service_security.services;


import org.gym.service_security.entities.PermissionEntity;

import java.util.List;

public interface PermissionService {
    PermissionEntity createPermission(String permissionName);

    List<PermissionEntity> getAllPermissions();
    void deletePermission(Integer id);
}
