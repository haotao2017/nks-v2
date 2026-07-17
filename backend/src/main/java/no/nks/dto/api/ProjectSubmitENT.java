package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class ProjectSubmitENT {
    private int ProjectID;
    private String InspectorComments;
    private String InspectorSignature;
    private LocalDateTime ProjectSubmitDate;
} 