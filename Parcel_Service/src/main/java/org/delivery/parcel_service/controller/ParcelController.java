package org.delivery.parcel_service.controller;

import lombok.RequiredArgsConstructor;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.dto.ParcelRequestDTO;
import org.delivery.parcel_service.dto.ParcelResponseDTO;
import org.delivery.parcel_service.service.ParcelService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/parcels")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class ParcelController {

    private final ParcelService parcelService;

    @PostMapping
    // استعملنا ROLE_DISPATCHER حيت هي اللي كاينا فـ الـ claim "authorities"
    @PreAuthorize("hasAuthority('ROLE_DISPATCHER')")
    public ResponseEntity<ParcelResponseDTO> createParcel(@RequestBody ParcelRequestDTO dto) {
        return new ResponseEntity<>(parcelService.createParcel(dto), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CLIENT', 'ROLE_DISPATCHER')")
    public ResponseEntity<List<ParcelResponseDTO>> getParcels(Principal principal) {
        return ResponseEntity.ok(parcelService.getParcels(principal));
    }

    @PatchMapping("/{id}/assign/{livreurId}")
    @PreAuthorize("hasAnyAuthority('ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> assignParcel(@PathVariable Long id, @PathVariable String livreurId) {
        parcelService.assignToLivreur(id, livreurId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_LIVREUR', 'ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam ParcelStatus status) {
        parcelService.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<ParcelResponseDTO> updateParcel(@PathVariable Long id, @RequestBody ParcelRequestDTO dto) {
        return ResponseEntity.ok(parcelService.updateParcel(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_DISPATCHER')")
    public ResponseEntity<Void> deleteParcel(@PathVariable Long id) {
        parcelService.deleteParcel(id);
        return ResponseEntity.noContent().build();
    }
}