package org.delivery.parcel_service.domain.repository;

import org.delivery.parcel_service.domain.entity.Parcel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParcelRepository extends JpaRepository<Parcel, Long> {
    // هادي غنحتاجوها فاش يجينا إيفينت من Kafka باش نحدثو معلومات الزبون فكاع طرودو
    List<Parcel> findBySenderId(Integer senderId);
    List<Parcel> findByZoneId(String zoneId); // هادي ضرورية
    Optional<Parcel> findByTrackingNumber(String trackingNumber);
}