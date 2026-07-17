package no.nks.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WrapperMultiDocTypes {
    private List<DocType> multiDocTypes;
} 