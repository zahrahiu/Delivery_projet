package org.delivery.parcel_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.delivery.parcel_service.domain.entity.ParcelStatus;
import org.delivery.parcel_service.dto.ClientUpdateRequest;
import org.delivery.parcel_service.dto.DeliveryConfirmationRequest;
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
@Tag(name = "Parcels", description = "API pour la gestion des colis (Parcels) et du suivi de livraison")
public class ParcelController {

    private final ParcelService parcelService;

    @Operation(summary = "Créer un nouveau colis", description = "Accessible uniquement par les DISPATCHER.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Colis créé avec succès"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_DISPATCHER')")
    public ResponseEntity<ParcelResponseDTO> createParcel(@RequestBody ParcelRequestDTO dto) {
        return new ResponseEntity<>(parcelService.createParcel(dto), HttpStatus.CREATED);
    }

    @Operation(summary = "Récupérer un colis par son ID")
    @GetMapping("/{id}")
    public ResponseEntity<ParcelResponseDTO> getParcelById(@PathVariable Long id) {
        return ResponseEntity.ok(parcelService.getParcelById(id));
    }

    @Operation(summary = "Lister les colis", description = "Récupère les colis selon le rôle (Client voit ses colis, Dispatcher voit tout).")
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CLIENT', 'ROLE_DISPATCHER', 'ROLE_LIVREUR')")
    public ResponseEntity<List<ParcelResponseDTO>> getParcels(
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(parcelService.getParcels(principal));
    }

    @Operation(summary = "Assigner un colis à un livreur", description = "Accessible par DISPATCHER ou ADMIN.")
    @PatchMapping("/{id}/assign/{livreurId}")
    @PreAuthorize("hasAnyAuthority('ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> assignParcel(@PathVariable Long id, @PathVariable String livreurId) {
        parcelService.assignToLivreur(id, livreurId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Mettre à jour le statut du colis", description = "Accessible par LIVREUR, DISPATCHER أو ADMIN.")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_LIVREUR', 'ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id,
            @RequestParam @Parameter(description = "Nouveau statut du colis (ex: IN_TRANSIT, DELIVERED)") ParcelStatus status) {
        parcelService.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Modifier les informations d'un colis")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<ParcelResponseDTO> updateParcel(@PathVariable Long id, @RequestBody ParcelRequestDTO dto) {
        return ResponseEntity.ok(parcelService.updateParcel(id, dto));
    }

    @Operation(summary = "Supprimer un colis")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_DISPATCHER')")
    public ResponseEntity<Void> deleteParcel(@PathVariable Long id) {
        parcelService.deleteParcel(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/track/{code}")
    public ResponseEntity<ParcelResponseDTO> getParcelByTrackingNumber(@PathVariable String code) {
        return ResponseEntity.ok(parcelService.getParcelByTrackingNumber(code));
    }

    @Operation(summary = "Confirmer la livraison avec signature numérique")
    @PostMapping("/{id}/confirm-delivery")
    @PreAuthorize("hasAnyAuthority('ROLE_LIVREUR', 'ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> confirmDelivery(
            @PathVariable Long id,
            @RequestBody DeliveryConfirmationRequest request) {
        parcelService.confirmDelivery(id, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Signaler un problème pour un colis")
    @PostMapping("/{id}/report-problem")
    @PreAuthorize("hasAnyAuthority('ROLE_LIVREUR', 'ROLE_DISPATCHER', 'ROLE_ADMIN')")
    public ResponseEntity<Void> reportProblem(
            @PathVariable Long id,
            @RequestBody String reason) {  // ⚠️ String مباشرة
        parcelService.reportProblem(id, reason);
        return ResponseEntity.ok().build();
    }


    @Operation(summary = "Mettre à jour les informations du colis par le client")
    @PatchMapping("/{id}/client-update")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT')")
    public ResponseEntity<Void> updateClientParcelInfo(
            @PathVariable Long id,
            @RequestBody ClientUpdateRequest request) {
        parcelService.updateClientParcelInfo(id, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Annuler un colis par le client")
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_CLIENT')")
    public ResponseEntity<Void> cancelParcelByClient(@PathVariable Long id) {
        parcelService.cancelParcelByClient(id);
        return ResponseEntity.ok().build();
    }
}