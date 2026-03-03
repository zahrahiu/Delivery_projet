package org.gym.service_security.services;


import org.gym.service_security.entities.Role;

import java.util.List;

public interface RoleService {

    Role createRole(String roleName);

    void assignPermissionToRole(String roleName, String permissionName);

    void removePermissionFromRole(String roleName, String permissionName);

    void deleteRoleByName(String roleName);

    List<Role> getAllRoles();
}
