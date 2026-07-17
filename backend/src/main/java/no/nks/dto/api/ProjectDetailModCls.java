package no.nks.dto.api;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ProjectDetailModCls {
    private int ProjectId;
    private String ProjectTitle;
    private String Description;
    private String Address;
    private String CreatedOn;
    private String Latitude;
    private String Longitude;
    private String LeaderName;
    private String LeaderNumber;
    private String FlislegerName;
    private String FlislegerNumber;
    private String SiteImageUrl;
    private String floorPlanUrl;
} 