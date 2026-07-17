package no.nks.dto.third.tripletex;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TripletexResponseDto<T> {
    private T value;
}
