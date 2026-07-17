package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ServiceWorkflowCategory")
public class ServiceWorkflowCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "WorkflowCategoryID", insertable = false, updatable = false)
    private Integer workflowCategoryId;

    @Column(name = "ServiceID", insertable = false, updatable = false)
    private Integer serviceId;

    @ManyToOne
    @JoinColumn(name = "ServiceID")
    private Service service;

    @ManyToOne
    @JoinColumn(name = "WorkflowCategoryID")
    private WorkflowCategory workflowCategory;
} 