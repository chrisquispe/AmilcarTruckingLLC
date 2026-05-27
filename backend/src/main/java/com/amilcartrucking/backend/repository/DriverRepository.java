package com.amilcartrucking.backend.repository;

import com.amilcartrucking.backend.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findAllByOrderByIsCommonDescNameAsc();
    boolean existsByName(String name);
}
