package org.delivery.users_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@FeignClient(name = "service-security", url = "http://security-service:8080")
public interface SecurityClient {

    @PostMapping("/v1/users/create")
    Map<String, Object> createAccount(@RequestBody Map<String, Object> securityReq);

    @PutMapping("/v1/users/{id}")
    Map<String, Object> updateAccount(@PathVariable("id") Integer id, @RequestBody Map<String, Object> securityReq);

    @PatchMapping("/v1/users/{id}/status")
    Map<String, Object> updateStatus(@PathVariable("id") Integer id, @RequestBody Map<String, Boolean> status);


    @PostMapping("/v1/users/register")
    Map<String, Object> registerAccount(@RequestBody Map<String, Object> securityReq);

    // ✅ زيد هاد الميثود
    @DeleteMapping("/v1/users/{id}")
    void deleteAccount(@PathVariable("id") Integer id);
}