package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class InspectionLogDto {
    private int Id;
    private int ProjectId;
    private LocalDateTime DateTime;
} 