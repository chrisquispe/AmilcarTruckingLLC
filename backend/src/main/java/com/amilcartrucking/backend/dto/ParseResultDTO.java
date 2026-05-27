package com.amilcartrucking.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ParseResultDTO {
    private List<TruckSectionDTO> trucks;
    private List<String> parseErrors;
}
