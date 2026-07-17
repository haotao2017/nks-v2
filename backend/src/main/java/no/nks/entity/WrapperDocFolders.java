package no.nks.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperDocFolders {
    
    @JsonProperty("DocFolders")
    private DocFolders docFolders;
} 