package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ProjectDetailContainer {
    private Response Response = new Response();
    private ProjectDetailModCls ProjectDetail = new ProjectDetailModCls();
    private List<ProjectChecklists> ListOfChecklists = new ArrayList<>();
} 