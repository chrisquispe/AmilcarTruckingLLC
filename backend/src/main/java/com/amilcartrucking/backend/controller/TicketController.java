package com.amilcartrucking.backend.controller;

import com.amilcartrucking.backend.dto.TicketCreateDTO;
import com.amilcartrucking.backend.dto.TicketDTO;
import com.amilcartrucking.backend.dto.TicketUpdateDTO;
import com.amilcartrucking.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PutMapping("/api/tickets/{id}")
    public ResponseEntity<?> updateTicket(@PathVariable Long id, @RequestBody TicketUpdateDTO dto) {
        try {
            return ResponseEntity.ok(ticketService.updateTicket(id, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/api/tickets/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        try {
            ticketService.deleteTicket(id);
            return ResponseEntity.ok(Map.of("message", "Ticket deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/reports/{reportId}/trucks/{truckId}/tickets")
    public ResponseEntity<?> createTicket(
            @PathVariable Long reportId,
            @PathVariable Long truckId,
            @RequestBody TicketCreateDTO dto) {
        try {
            TicketDTO created = ticketService.createTicket(reportId, truckId, dto);
            return ResponseEntity.ok(created);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
