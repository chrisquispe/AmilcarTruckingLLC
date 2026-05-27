package com.amilcartrucking.backend.repository;

import com.amilcartrucking.backend.model.ExtractedTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ExtractedTicketRepository extends JpaRepository<ExtractedTicket, Long> {
    List<ExtractedTicket> findByReportId(Long reportId);
    List<ExtractedTicket> findByReportIdAndTruckId(Long reportId, Long truckId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ExtractedTicket t WHERE t.report.id = :reportId")
    void deleteByReportId(Long reportId);
}
