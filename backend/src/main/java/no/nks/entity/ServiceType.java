package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ServiceType")
public class ServiceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Lob
    @Column(name = "Name", columnDefinition = "nvarchar(max)")
    private String name;

    @Column(name = "sortOrder")
    private Integer sortOrder;
} 