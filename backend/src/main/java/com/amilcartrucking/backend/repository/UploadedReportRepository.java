package com.amilcartrucking.backend.repository;

import com.amilcartrucking.backend.model.UploadedReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UploadedReportRepository extends JpaRepository<UploadedReport, Long> {
    List<UploadedReport> findAllByOrderByUploadDateDesc();
}
