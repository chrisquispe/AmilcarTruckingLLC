package com.amilcartrucking.backend.repository;

import com.amilcartrucking.backend.model.ReportTotal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ReportTotalRepository extends JpaRepository<ReportTotal, Long> {
    List<ReportTotal> findByReportId(Long reportId);
    Optional<ReportTotal> findByReportIdAndTruckId(Long reportId, Long truckId);

    @Query("SELECT rt FROM ReportTotal rt WHERE rt.truck.id = :truckId ORDER BY rt.report.uploadDate DESC")
    List<ReportTotal> findByTruckIdOrderByReportDateDesc(Long truckId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ReportTotal rt WHERE rt.report.id = :reportId")
    void deleteByReportId(Long reportId);
}
