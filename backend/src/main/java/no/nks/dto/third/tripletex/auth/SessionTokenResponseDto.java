package no.nks.dto.third.tripletex.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SessionTokenResponseDto {

    @JsonProperty("value")
    private SessionToken value;
}
