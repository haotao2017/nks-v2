package no.nks.entity;

import lombok.Data;
import java.util.List;

@Data
public class ResponseBuildingSupplier {
    private RequestResponse requestResponse;
    private List<ProjectAssociatedWithBuildingSup> projectAssociatedWithBuildingSupplier;
} 