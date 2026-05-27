package com.amilcartrucking.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "extracted_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedTicket {

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

    @Column(name = "ticket_number", length = 50)
    private String ticketNumber;

    @Column(name = "ticket_date")
    private LocalDate ticketDate;

    @Column(precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(name = "pay_amount", precision = 14, scale = 2)
    private BigDecimal payAmount;

    @Column(name = "pay_rate", precision = 14, scale = 4)
    private BigDecimal payRate;

    @Column(name = "is_fuel_surcharge")
    private boolean isFuelSurcharge = false;

    @Column(name = "is_edited")
    private boolean isEdited = false;
}
