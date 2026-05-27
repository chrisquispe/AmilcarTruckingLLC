package com.amilcartrucking.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(
    name = "report_totals",
    uniqueConstraints = @UniqueConstraint(columnNames = {"report_id", "truck_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportTotal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private UploadedReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "truck_id", nullable = false)
    private Truck truck;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(name = "driver_percentage", precision = 5, scale = 2)
    private BigDecimal driverPercentage = new BigDecimal("33.00");

    @Column(name = "include_fuel_in_total")
    private boolean includeFuelInTotal = false;

    @Column(name = "main_total", precision = 10, scale = 2)
    private BigDecimal mainTotal;

    @Column(name = "fuel_total", precision = 10, scale = 2)
    private BigDecimal fuelTotal;

    @Column(name = "driver_pay", precision = 10, scale = 2)
    private BigDecimal driverPay;

    @Column(name = "generated_pdf_path")
    private String generatedPdfPath;
}
