package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.GenericApiResponseDto;
import no.nks.dto.PartyTypeDto;
import no.nks.dto.PartyTypeResponseDto;
import no.nks.entity.PartyType;
import no.nks.exception.PartyTypeAccessDeniedException;
import no.nks.exception.PartyTypeNotFoundException;
import no.nks.repository.PartyTypeRepository;
import no.nks.service.PartyTypeService;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartyTypeServiceImpl implements PartyTypeService {

    private final PartyTypeRepository partyTypeRepository;

    @Override
    public PartyTypeResponseDto getSinglePartyType(Integer partyTypeId, Integer companyId) {
        log.debug("Fetching party type with ID: {} for company ID: {}", partyTypeId, companyId);

        try {
            PartyType partyType = partyTypeRepository.findByIdAndCompanyId(partyTypeId, companyId)
                    .orElseThrow(() -> new PartyTypeNotFoundException(partyTypeId));

            return new PartyTypeResponseDto(mapToDto(partyType));
        } catch (DataAccessException ex) {
            log.error("Database error while fetching party type with ID: {}", partyTypeId, ex);
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while fetching party type with ID: {}", partyTypeId, ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public PartyTypeResponseDto updatePartyType(PartyTypeDto partyTypeDto, Integer companyId) {
        log.debug("Updating party type with ID: {} for company ID: {}", partyTypeDto.getId(), companyId);

        try {
            PartyType existingPartyType = partyTypeRepository.findById(partyTypeDto.getId())
                    .orElseThrow(() -> new PartyTypeNotFoundException(partyTypeDto.getId()));

            // Verify company ownership
            if (!companyId.equals(existingPartyType.getCompanyId())) {
                throw new PartyTypeAccessDeniedException(partyTypeDto.getId());
            }

            // Update the fields
            existingPartyType.setName(partyTypeDto.getName());
            existingPartyType.setDefault(partyTypeDto.isDefault());
            existingPartyType.setWorkflowCategoryId(partyTypeDto.getWorkflowCategoryID());

            // Save the updated entity
            PartyType updatedPartyType = partyTypeRepository.save(existingPartyType);

            return new PartyTypeResponseDto(mapToDto(updatedPartyType));
        } catch (DataAccessException ex) {
            log.error("Database error while updating party type with ID: {}", partyTypeDto.getId(), ex);
            throw ex;
        } catch (PartyTypeNotFoundException | PartyTypeAccessDeniedException ex) {
            // 重新抛出已定义的异常，这些将由全局异常处理器处理
            log.warn(ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while updating party type with ID: {}", partyTypeDto.getId(), ex);
            throw ex;
        }
    }

    @Override
    @Transactional
    public GenericApiResponseDto deletePartyType(Integer partyTypeId, Integer companyId) {
        log.debug("Deleting party type with ID: {} for company ID: {}", partyTypeId, companyId);

        try {
            PartyType partyType = partyTypeRepository.findById(partyTypeId)
                    .orElseThrow(() -> new PartyTypeNotFoundException(partyTypeId));

            // Verify company ownership
            if (!companyId.equals(partyType.getCompanyId())) {
                throw new PartyTypeAccessDeniedException(partyTypeId);
            }

            partyTypeRepository.delete(partyType);
            return new GenericApiResponseDto("Record deleted", true);
        } catch (DataAccessException ex) {
            log.error("Database error while deleting party type with ID: {}", partyTypeId, ex);
            return new GenericApiResponseDto("Failed to delete record: " + ex.getMessage(), false);
        } catch (PartyTypeNotFoundException | PartyTypeAccessDeniedException ex) {
            log.warn(ex.getMessage());
            return new GenericApiResponseDto(ex.getMessage(), false);
        } catch (Exception ex) {
            log.error("Unexpected error while deleting party type with ID: {}", partyTypeId, ex);
            return new GenericApiResponseDto("An unexpected error occurred: " + ex.getMessage(), false);
        }
    }

    @Override
    @Transactional
    public PartyTypeResponseDto createPartyType(PartyTypeDto partyTypeDto, Integer companyId) {
        log.debug("Creating new party type for company ID: {}", companyId);

        try {
            PartyType partyType = mapToEntity(partyTypeDto);
            partyType.setCompanyId(companyId);
            partyType.setId(null);  // Ensure we create a new entity

            PartyType savedPartyType = partyTypeRepository.save(partyType);

            return new PartyTypeResponseDto(mapToDto(savedPartyType));
        } catch (DataAccessException ex) {
            log.error("Database error while creating party type", ex);
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while creating party type", ex);
            throw ex;
        }
    }

    @Override
    public List<PartyTypeDto> getAllPartyTypes(Integer companyId) {
        log.debug("Fetching all party types for company ID: {}", companyId);

        try {
            List<PartyType> partyTypes = partyTypeRepository.findAllByCompanyId(companyId);

            return partyTypes.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (DataAccessException ex) {
            log.error("Database error while fetching all party types", ex);
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while fetching all party types", ex);
            throw ex;
        }
    }

    /**
     * Map a PartyType entity to a PartyTypeDto
     */
    private PartyTypeDto mapToDto(PartyType entity) {
        return PartyTypeDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .sortOrder(entity.getSortOrder())
                .isDefault(entity.isDefault())
                .workflowCategoryID(entity.getWorkflowCategoryId())
                .companyID(entity.getCompanyId())
                .build();
    }

    /**
     * Map a PartyTypeDto to a PartyType entity
     */
    private PartyType mapToEntity(PartyTypeDto dto) {
        return PartyType.builder()
                .id(dto.getId())
                .name(dto.getName())
                .sortOrder(dto.getSortOrder())
                .isDefault(dto.isDefault())
                .workflowCategoryId(dto.getWorkflowCategoryID())
                .companyId(dto.getCompanyID())
                .build();
    }
}
