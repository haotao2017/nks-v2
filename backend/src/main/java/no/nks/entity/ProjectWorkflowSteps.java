package no.nks.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ProjectWorkflowSteps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectWorkflowSteps {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false)
    private Integer projectId;
    
    @Column(nullable = false)
    private Integer workflowId;
    
    @Column(nullable = false)
    private Integer workflowStepId;
    
    @Column(nullable = false)
    private Boolean isTransfer;
    
    @Column
    private Integer taskId;
    
    @Column
    private LocalDateTime insertDate;
    
    @Column
    private Integer insertedBy;
    
    @Column
    private Integer serviceWorkflowCategoryId;
} 