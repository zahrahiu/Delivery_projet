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
@RequiredArgsConstructor
public class ParcelController {

    private final ParcelService parcelService;

    // بدلي hasAuthority بـ hasRole
    @PostMapping
    @PreAuthorize("hasRole('DISPATCHER')")
    public ResponseEntity<ParcelResponseDTO> createParcel(@RequestBody ParcelRequestDTO dto) {
        return new ResponseEntity<>(parcelService.createParcel(dto), HttpStatus.CREATED);
    }

    // هادي مزيانة
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ResponseEntity<List<ParcelResponseDTO>> getParcels(Principal principal) {
        return ResponseEntity.ok(parcelService.getParcels(principal));
    }

    @PatchMapping("/{id}/assign/{livreurId}")
    @PreAuthorize("hasRole('DISPATCHER')")
    public ResponseEntity<Void> assignParcel(@PathVariable Long id, @PathVariable String livreurId) {
        parcelService.assignToLivreur(id, livreurId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DISPATCHER')")
    public ResponseEntity<ParcelResponseDTO> updateParcel(@PathVariable Long id, @RequestBody ParcelRequestDTO dto) {
        return ResponseEntity.ok(parcelService.updateParcel(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // غير الأدمن اللي يقدر يحذف
    public ResponseEntity<Void> deleteParcel(@PathVariable Long id) {
        parcelService.deleteParcel(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('LIVREUR') or hasRole('DISPATCHER')")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam ParcelStatus status) {
        parcelService.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }
}