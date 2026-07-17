package no.nks.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "ServicePerSlab")
public class ServicePerSlab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private Integer id;

    @Column(name = "RangeFrom")
    private Integer rangeFrom;

    @Column(name = "RangeTo")
    private Integer rangeTo;

    @Column(name = "Rate", length = 50)
    private String rate;

    @Column(name = "ServiceId", insertable = false, updatable = false)
    private Integer serviceId;

    @ManyToOne
    @JoinColumn(name = "ServiceId")
    private Service service;
} 