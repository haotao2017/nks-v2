package no.nks.entity;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProjectAssociatedWithBuildingSup {
    private Integer id;
    private String title;
    
    public ProjectAssociatedWithBuildingSup(Integer id, String title) {
        this.id = id;
        this.title = title;
    }
} 