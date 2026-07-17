package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class ResponseContainer {
    private Response Response;
    private List<Login> ListOfProjects = new ArrayList<>();

    public ResponseContainer(Response response) {
        this.Response = response;
    }
} 