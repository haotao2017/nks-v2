package no.nks.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "PostNumber")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostNumber {
    
    @Id
    @Column(name = "Postnummer")
    private Integer postnummer;
    
    @Column(name = "Poststed", length = 100)
    private String poststed;
    
    @Column(name = "Kommunenummer")
    private Integer kommunenummer;
    
    @Column(name = "Kommunenavn", length = 100)
    private String kommunenavn;
    
    @Column(name = "Kategori", length = 10)
    private String kategori;
} 