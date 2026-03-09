package org.delivery.users_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name = "service-security", url = "http://localhost:8080/v1/users")
public interface SecurityClient {

    @PostMapping("/create")
    Map<String, Object> createAccount(@RequestBody Map<String, Object> securityReq);

    @PutMapping("/{id}")
    Map<String, Object> updateAccount(@PathVariable("id") Integer id, @RequestBody Map<String, Object> securityReq);
}