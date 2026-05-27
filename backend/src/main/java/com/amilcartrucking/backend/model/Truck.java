package com.amilcartrucking.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "trucks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "truck_number", nullable = false, unique = true, length = 20)
    private String truckNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
