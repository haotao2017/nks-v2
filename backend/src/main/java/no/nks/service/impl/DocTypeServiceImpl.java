package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.dto.RequestResponse;
import no.nks.entity.DocType;
import no.nks.entity.WrapperDocType;
import no.nks.entity.WrapperMultiDocTypes;
import no.nks.repository.DocTypeRepository;
import no.nks.service.DocTypeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocTypeServiceImpl implements DocTypeService {

    private final DocTypeRepository docTypeRepository;

    @Override
    public WrapperDocType getSingleDocType(Integer id, Integer companyId) {
        WrapperDocType data = new WrapperDocType();
        Optional<DocType> docTypeOpt = docTypeRepository.findById(id);

        if (docTypeOpt.isPresent() && companyId.equals(docTypeOpt.get().getCompanyId())) {
            data.setDocType(docTypeOpt.get());
        } else {
            log.warn("Document type with id {} not found for company {}", id, companyId);
        }

        return data;
    }

    @Override
    public WrapperMultiDocTypes getAllDocType(Integer companyId) {
        WrapperMultiDocTypes data = new WrapperMultiDocTypes();
        List<DocType> docTypes = docTypeRepository.findByCompanyId(companyId);
        data.setMultiDocTypes(docTypes);
        return data;
    }

    @Override
    @Transactional
    public WrapperDocType updateSingleDocType(DocType docType, Integer companyId) {
        WrapperDocType data = new WrapperDocType();

        // Ensure the record exists and belongs to the requesting company before updating.
        // Sparse body: copy existing then overlay only non-null incoming fields
        // so omitted/null fields do not wipe persisted values (e.g. sortOrder, partyTypeId).
        Optional<DocType> existingOpt = docTypeRepository.findById(docType.getId());
        if (existingOpt.isPresent() && companyId.equals(existingOpt.get().getCompanyId())) {
            DocType existing = existingOpt.get();
            if (docType.getDocName() != null) {
                existing.setDocName(docType.getDocName());
            }
            if (docType.getIsRequired() != null) {
                existing.setIsRequired(docType.getIsRequired());
            }
            if (docType.getPartyTypeId() != null) {
                existing.setPartyTypeId(docType.getPartyTypeId());
            }
            if (docType.getSortOrder() != null) {
                existing.setSortOrder(docType.getSortOrder());
            }
            existing.setCompanyId(companyId);
            DocType updatedDocType = docTypeRepository.save(existing);
            data.setDocType(updatedDocType);
        } else {
            log.warn("Document type with id {} not found for update for company {}", docType.getId(), companyId);
        }

        return data;
    }

    @Override
    @Transactional
    public WrapperDocType createSingleDocType(DocType docType, Integer companyId) {
        WrapperDocType data = new WrapperDocType();

        // Set the company ID from the authenticated user
        docType.setCompanyId(companyId);

        DocType createdDocType = docTypeRepository.save(docType);
        data.setDocType(createdDocType);

        return data;
    }

    @Override
    @Transactional
    public RequestResponse deleteSingleDocType(Integer id, Integer companyId) {
        RequestResponse response = new RequestResponse();

        try {
            Optional<DocType> docTypeOpt = docTypeRepository.findById(id);
            if (docTypeOpt.isPresent() && companyId.equals(docTypeOpt.get().getCompanyId())) {
                docTypeRepository.deleteById(id);
                response.setSuccess(true);
                response.setMessage("Record deleted");
                response.setUserProfileID(null);
                response.setDataCompany(null);
                response.setAdminUser(false);
            } else {
                response.setSuccess(false);
                response.setMessage("Document type not found");
                response.setUserProfileID(null);
                response.setDataCompany(null);
                response.setAdminUser(false);
                log.warn("Document type with id {} not found for deletion for company {}", id, companyId);
            }
        } catch (Exception ex) {
            response.setSuccess(false);
            response.setMessage(ex.getMessage());
            response.setUserProfileID(null);
            response.setDataCompany(null);
            response.setAdminUser(false);
            log.error("Error deleting document type: {}", ex.getMessage(), ex);
        }

        return response;
    }
}
