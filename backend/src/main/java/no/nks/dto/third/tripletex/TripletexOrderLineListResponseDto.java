package no.nks.dto.third.tripletex;

import lombok.Data;

import java.util.List;

@Data
public class TripletexOrderLineListResponseDto {
    private List<TripletexOrderLineDto> values;
    // We can add other fields from the wrapper object if needed,
    // e.g., fullResultSize, from, count
}
