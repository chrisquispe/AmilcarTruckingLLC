package com.amilcartrucking.backend.service;

import com.amilcartrucking.backend.dto.TicketCreateDTO;
import com.amilcartrucking.backend.dto.TicketDTO;
import com.amilcartrucking.backend.dto.TicketUpdateDTO;
import com.amilcartrucking.backend.model.ExtractedTicket;
import com.amilcartrucking.backend.model.Truck;
import com.amilcartrucking.backend.model.UploadedReport;
import com.amilcartrucking.backend.repository.ExtractedTicketRepository;
import com.amilcartrucking.backend.repository.TruckRepository;
import com.amilcartrucking.backend.repository.UploadedReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final ExtractedTicketRepository ticketRepo;
    private final UploadedReportRepository reportRepo;
    private final TruckRepository truckRepo;

    @Transactional
    public TicketDTO updateTicket(Long ticketId, TicketUpdateDTO dto) {
        ExtractedTicket ticket = ticketRepo.findById(ticketId)
            .orElseThrow(() -> new NoSuchElementException("Ticket not found: " + ticketId));

        if (dto.getTicketNumber() != null) ticket.setTicketNumber(dto.getTicketNumber());
        if (dto.getTicketDate() != null) ticket.setTicketDate(dto.getTicketDate());
        if (dto.getQuantity() != null) ticket.setQuantity(dto.getQuantity());
        if (dto.getPayAmount() != null) ticket.setPayAmount(dto.getPayAmount());
        if (dto.getPayRate() != null) ticket.setPayRate(dto.getPayRate());
        if (dto.getIsFuelSurcharge() != null) ticket.setFuelSurcharge(dto.getIsFuelSurcharge());
        ticket.setEdited(true);

        return toDto(ticketRepo.save(ticket));
    }

    @Transactional
    public TicketDTO createTicket(Long reportId, Long truckId, TicketCreateDTO dto) {
        UploadedReport report = reportRepo.findById(reportId)
            .orElseThrow(() -> new NoSuchElementException("Report not found: " + reportId));
        Truck truck = truckRepo.findById(truckId)
            .orElseThrow(() -> new NoSuchElementException("Truck not found: " + truckId));

        ExtractedTicket ticket = new ExtractedTicket();
        ticket.setReport(report);
        ticket.setTruck(truck);
        ticket.setTicketNumber(dto.getTicketNumber());
        ticket.setTicketDate(dto.getTicketDate());
        ticket.setQuantity(dto.getQuantity());
        ticket.setPayAmount(dto.getPayAmount());
        ticket.setPayRate(dto.getPayRate());
        ticket.setFuelSurcharge(dto.isFuelSurcharge());
        ticket.setEdited(true);

        return toDto(ticketRepo.save(ticket));
    }

    @Transactional
    public void deleteTicket(Long ticketId) {
        if (!ticketRepo.existsById(ticketId)) {
            throw new NoSuchElementException("Ticket not found: " + ticketId);
        }
        ticketRepo.deleteById(ticketId);
    }

    public TicketDTO toDto(ExtractedTicket t) {
        TicketDTO dto = new TicketDTO();
        dto.setId(t.getId());
        dto.setTruckId(t.getTruck().getId());
        dto.setTruckNumber(t.getTruck().getTruckNumber());
        if (t.getDriver() != null) {
            dto.setDriverId(t.getDriver().getId());
            dto.setDriverName(t.getDriver().getName());
        }
        dto.setTicketNumber(t.getTicketNumber());
        dto.setTicketDate(t.getTicketDate());
        dto.setQuantity(t.getQuantity());
        dto.setPayAmount(t.getPayAmount());
        dto.setPayRate(t.getPayRate());
        dto.setFuelSurcharge(t.isFuelSurcharge());
        dto.setEdited(t.isEdited()); // matches renamed DTO fields: fuelSurcharge, edited
        return dto;
    }
}
