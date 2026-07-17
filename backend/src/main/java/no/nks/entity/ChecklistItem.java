package no.nks.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 检查清单项实体类
 */
@Entity
@Table(name = "ChecklistItems")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "ChecklistId")
    private Integer checklistId;
    
    @Column(name = "Title")
    private String title;
    
    @Column(name = "SortOrder")
    private Integer sortOrder;
    
    @Column(name = "Status")
    private String status;
    
    @Column(name = "Comment")
    private String comment;
    
    @Column(name = "FixDate")
    private LocalDateTime fixDate;
    
    @Column(name = "wasDev")
    private Boolean wasDev;
    
    @Column(name = "EmailPartyDate")
    private LocalDateTime emailPartyDate;
    
    @Column(name = "PartyUploadedImgDate")
    private LocalDateTime partyUploadedImgDate;
    
    @Column(name = "EmailTempToPartiesIds")
    private String emailTempToPartiesIds;
    
    @Column(name = "isImageUploadedByParty")
    private Boolean isImageUploadedByParty;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ChecklistId", insertable = false, updatable = false)
    private ProjectChecklist checklist;
    
    @OneToMany(mappedBy = "checklistItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChecklistItemImage> images = new ArrayList<>();
} 