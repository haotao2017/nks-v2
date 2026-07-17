package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class Login {
    private String ProjectID;
    private String ProjectName;
    private String ProjectDetail;
    private LocalDateTime InspectionDate;
} 