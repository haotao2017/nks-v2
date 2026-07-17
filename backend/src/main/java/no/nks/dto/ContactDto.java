package no.nks.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactDto {
    private Integer id;
    private String name;
    private String contactNo;
    private String email;
    private String companyName;
    @JsonIgnore
    private Integer companyId;
}
