package no.nks.dto;

import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class WrapperMultiService {
    private List<ServiceDto> multiService;
}
