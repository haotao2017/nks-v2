package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class ProjectUpdateENT {
    private int ProjectID;
    private String ProjectDescription;
    private LocalDateTime ProjectDate;
} 