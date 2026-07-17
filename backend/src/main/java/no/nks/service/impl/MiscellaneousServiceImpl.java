package no.nks.service.impl;

import jakarta.persistence.EntityNotFoundException;
import no.nks.dto.PostCodeDto;
import no.nks.dto.WrapperPostCodeDto;
import no.nks.entity.PostNumber;
import no.nks.repository.PostNumberRepository;
import no.nks.service.MiscellaneousService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MiscellaneousServiceImpl implements MiscellaneousService {

    private final PostNumberRepository postNumberRepository;

    @Autowired
    public MiscellaneousServiceImpl(PostNumberRepository postNumberRepository) {
        this.postNumberRepository = postNumberRepository;
    }

    @Override
    public WrapperPostCodeDto getAllPostCodes() {
        List<PostNumber> postNumbers = postNumberRepository.findAll();
        List<PostCodeDto> postCodeDtos = postNumbers.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        WrapperPostCodeDto wrapperDto = new WrapperPostCodeDto();
        wrapperDto.setPostCodes(postCodeDtos);
        return wrapperDto;
    }

    @Override
    public PostCodeDto getPostCodeByPostNumber(String postNumber) {
        try {
            Integer postNumberInt = Integer.parseInt(postNumber);
            PostNumber postNumberEntity = postNumberRepository.findByPostnummer(postNumberInt)
                    .orElseThrow(() -> new EntityNotFoundException("Postal code not found with number: " + postNumber));
            return convertToDto(postNumberEntity);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid postal code format: " + postNumber);
        }
    }

    /**
     * 将实体转换为 DTO
     * @param entity PostNumber 实体
     * @return PostCodeDto 对象
     */
    private PostCodeDto convertToDto(PostNumber entity) {
        PostCodeDto dto = new PostCodeDto();
        dto.setId(entity.getPostnummer()); // 使用 postnummer 作为 ID
        dto.setPostnummer(entity.getPostnummer().toString());
        dto.setPoststed(entity.getPoststed());
        dto.setKommunenummer(entity.getKommunenummer() != null ? entity.getKommunenummer().toString() : null);
        dto.setKommunenavn(entity.getKommunenavn());
        dto.setKategori(entity.getKategori());
        return dto;
    }
}
