package no.nks.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostCodeDto {
    private Integer id;
    private String postnummer;
    private String poststed;
    private String kommunenummer;
    private String kommunenavn;
    private String kategori;
}
