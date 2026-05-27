package com.amilcartrucking.backend.repository;

import com.amilcartrucking.backend.model.Truck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TruckRepository extends JpaRepository<Truck, Long> {
    Optional<Truck> findByTruckNumber(String truckNumber);
    boolean existsByTruckNumber(String truckNumber);
}
