package com.amilcartrucking.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "uploaded_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UploadedReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "week_of")
    private LocalDate weekOf;

    @Column(name = "upload_date")
    private LocalDateTime uploadDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.UPLOADED;

    @Column(name = "generated_pdf_path")
    private String generatedPdfPath;

    public enum ReportStatus {
        UPLOADED, PARSED, REVIEWED, GENERATED
    }
}
