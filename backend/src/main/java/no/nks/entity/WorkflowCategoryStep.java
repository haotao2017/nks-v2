package no.nks.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "WorkflowCategorySteps")
public class WorkflowCategoryStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "WorkflowCategoryID")
    private Integer workflowCategoryId;

    @Column(name = "StepName")
    private String stepName;

    @Column(name = "StepSequence")
    private Integer stepSequence;

    @Column(name = "IsActive")
    private boolean isActive;

    @Column(name = "IsTransferable")
    private boolean isTransferable;
} 