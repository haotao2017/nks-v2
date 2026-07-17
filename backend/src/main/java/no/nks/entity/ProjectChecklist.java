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
 * 项目检查清单实体类
 */
@Entity
@Table(name = "ProjectChecklist")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectChecklist {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "ProjectId")
    private Integer projectId;
    
    @Column(name = "SortOrder")
    private Integer sortOrder;
    
    @Column(name = "ChecklistName")
    private String checklistName;
    
    @Column(name = "StartDate")
    private LocalDateTime startDate;
    
    @Column(name = "EndDate")
    private LocalDateTime endDate;
    
    @Column(name = "Comment")
    private String comment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ProjectId", insertable = false, updatable = false)
    private Project project;
    
    @OneToMany(mappedBy = "checklist", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChecklistItem> checklistItems = new ArrayList<>();
} 