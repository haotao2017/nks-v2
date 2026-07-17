package no.nks.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.entity.Doc;
import no.nks.repository.DocRepository;
import no.nks.service.FileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    private final DocRepository docRepository;

    @Override
    public boolean uploadFile(MultipartFile file, String fileName, String folderPath) {
        try {
            // Implementation would use AWS S3 or similar storage service
            // Here we just simulate success for API compatibility
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getPublicUrl(String fileName, String folderPath) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }
        // Simulate URL creation
        return "/api/files/" + folderPath + "/" + fileName;
    }

    @Override
    public Optional<Doc> getDocument(Integer projectId, Integer docTypeId) {
        // Using the available repository method and filtering by docTypeId
        List<Doc> docs = docRepository.findByProjectId(projectId);
        return docs.stream()
                .filter(doc -> docTypeId.equals(doc.getPartyDocTypeId()))
                .findFirst();
    }
}
