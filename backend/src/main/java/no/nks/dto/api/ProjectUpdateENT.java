package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProjectUpdateENT {
    private int ProjectID;
    private String ProjectDescription;
    /** 用 String 承接:App 常发带 Z 的 ISO(toISOString),再在 service 里宽松解析为 LocalDateTime。 */
    private String ProjectDate;
} 