package no.nks.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.entity.CompanyProfile;
import no.nks.entity.DocFolders;
import no.nks.entity.GeneralSetting;
import no.nks.entity.S3Bucket;
import no.nks.entity.WrapperCompanyProfile;
import no.nks.entity.WrapperMultiCompanyProfile;
import no.nks.repository.DocFoldersRepository;
import no.nks.repository.GeneralSettingRepository;
import no.nks.repository.S3bucketRepository;
import no.nks.service.CompanyProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyProfileServiceImpl implements CompanyProfileService {

    private final GeneralSettingRepository generalSettingRepository;
    private final S3bucketRepository s3bucketRepository;
    private final DocFoldersRepository docFoldersRepository;

    @Override
    public WrapperCompanyProfile getProfile(int companyID) {
        log.info("Getting company profile for company ID: {}", companyID);
        WrapperCompanyProfile wrapper = new WrapperCompanyProfile();

        Optional<GeneralSetting> generalSettingOpt = generalSettingRepository.findById(companyID);
        if (generalSettingOpt.isPresent()) {
            wrapper.setCompanyProfile(mapToCompanyProfile(generalSettingOpt.get()));
        } else {
            log.warn("Company with ID {} not found", companyID);
            throw new EntityNotFoundException("Company with ID " + companyID + " not found");
        }

        return wrapper;
    }

    @Override
    public WrapperMultiCompanyProfile getAllProfiles() {
        log.info("Getting all company profiles");
        WrapperMultiCompanyProfile wrapper = new WrapperMultiCompanyProfile();

        List<GeneralSetting> settings = generalSettingRepository.findAll();
        for (GeneralSetting setting : settings) {
            wrapper.getMultiCompanyProfile().add(mapToCompanyProfile(setting));
        }

        return wrapper;
    }

    @Override
    @Transactional
    public CompanyProfile update(CompanyProfile companyProfile, boolean isSystemOwner) {
        log.info("Updating company profile with ID: {}", companyProfile.getId());

        GeneralSetting generalSetting = mapToGeneralSetting(companyProfile);
        Optional<GeneralSetting> existingOpt = generalSettingRepository.findById(companyProfile.getId());

        if (existingOpt.isEmpty()) {
            log.error("Cannot update company with ID {}: not found", companyProfile.getId());
            throw new EntityNotFoundException("Company with ID " + companyProfile.getId() + " not found");
        }

        GeneralSetting existing = existingOpt.get();

        // 保留原有的激活状态，除非当前操作者是系统管理员
        if (isSystemOwner) {
            generalSetting.setIsActive(companyProfile.getIsActive());
        } else {
            generalSetting.setIsActive(existing.getIsActive());
        }

        GeneralSetting updated = generalSettingRepository.save(generalSetting);
        return mapToCompanyProfile(updated);
    }

    @Override
    @Transactional
    public CompanyProfile add(CompanyProfile companyProfile) {
        log.info("Adding new company profile");

        GeneralSetting generalSetting = mapToGeneralSetting(companyProfile);
        GeneralSetting saved = generalSettingRepository.save(generalSetting);

        companyProfile.setId(saved.getId());
        return companyProfile;
    }

    @Override
    public S3Bucket getBucketDetail() {
        log.info("Getting S3 bucket details");
        S3Bucket bucket = s3bucketRepository.findByIsActiveTrue();
        if (bucket == null) {
            log.warn("No active S3 bucket found");
            throw new EntityNotFoundException("No active S3 bucket found");
        }
        return bucket;
    }

    @Override
    @Transactional
    public S3Bucket updateS3Bucket(S3Bucket s3bucket) {
        log.info("Updating S3 bucket with ID: {}", s3bucket.getId());
        if (s3bucket.getId() == null) {
            log.error("Cannot update S3 bucket with null ID");
            throw new IllegalArgumentException("S3 bucket ID cannot be null");
        }
        return s3bucketRepository.save(s3bucket);
    }

    @Override
    public List<DocFolders> getAllCompaniesFolders() {
        log.info("Getting all company folders");
        return docFoldersRepository.findAll();
    }

    @Override
    public DocFolders getSingleCompanyFolder(int companyID) {
        log.info("Getting folder for company ID: {}", companyID);
        List<DocFolders> folders = docFoldersRepository.findByCompanyId(companyID);

        if (folders.isEmpty()) {
            log.warn("Folder for company ID {} not found", companyID);
            throw new EntityNotFoundException("Folder for company ID " + companyID + " not found");
        }

        if (folders.size() > 1) {
            log.warn("Multiple folders found for company ID {}, returning first one", companyID);
            // 如果有多个文件夹，返回第一个
        }

        return folders.get(0);
    }

    @Override
    @Transactional
    public DocFolders updateSingleCompanyFolder(DocFolders docFolders) {
        log.info("Updating folder with ID: {}", docFolders.getId());
        if (docFolders.getId() == null) {
            log.error("Cannot update folder with null ID");
            throw new IllegalArgumentException("Folder ID cannot be null");
        }

        // 检查文件夹是否存在并获取现有对象
        Optional<DocFolders> existingFolderOpt = docFoldersRepository.findById(docFolders.getId());
        if (existingFolderOpt.isEmpty()) {
            log.warn("Folder with ID {} not found", docFolders.getId());
            throw new EntityNotFoundException("Folder with ID " + docFolders.getId() + " not found");
        }

        // 获取现有对象
        DocFolders existingFolder = existingFolderOpt.get();

        // 更新除createDate外的所有字段
        docFolders.setCreateDate(existingFolder.getCreateDate()); // 保留原来的创建日期

        return docFoldersRepository.save(docFolders);
    }

    @Override
    @Transactional
    public DocFolders addCompanyFolder(DocFolders docFolders) {
        log.info("Adding new company folder");
        if (docFolders.getCompanyId() == null) {
            log.error("Cannot add folder with null company ID");
            throw new IllegalArgumentException("Company ID cannot be null");
        }

        // 检查该公司是否已有文件夹记录
        try {
            List<DocFolders> existingFolders = docFoldersRepository.findByCompanyId(docFolders.getCompanyId());
            if (!existingFolders.isEmpty()) {
                log.info("Folder for company ID {} already exists, returning existing record", docFolders.getCompanyId());

                // 如果有多条记录，保留第一条，删除其他
                if (existingFolders.size() > 1) {
                    DocFolders firstFolder = existingFolders.get(0);
                    for (int i = 1; i < existingFolders.size(); i++) {
                        docFoldersRepository.delete(existingFolders.get(i));
                    }
                    log.info("Cleaned up duplicate folders for company ID {}, kept folder ID {}",
                            docFolders.getCompanyId(), firstFolder.getId());
                    return firstFolder;
                }

                return existingFolders.get(0);
            }
        } catch (Exception e) {
            // 如果查询出现其他异常，记录日志
            log.warn("Error checking existing folders for company ID {}: {}",
                    docFolders.getCompanyId(), e.getMessage());
        }

        docFolders.setCreateDate(LocalDateTime.now());
        DocFolders saved = docFoldersRepository.save(docFolders);
        docFolders.setId(saved.getId());
        return docFolders;
    }

    // 辅助方法：将 GeneralSetting 转换为 CompanyProfile
    private CompanyProfile mapToCompanyProfile(GeneralSetting setting) {
        CompanyProfile profile = new CompanyProfile();
        profile.setId(setting.getId());
        profile.setCompanyName(setting.getCompanyName());
        profile.setOrganizationalNumber(setting.getOrganizationalNumber());
        profile.setAddress(setting.getAddress());
        profile.setOwnerName(setting.getOwnerName());
        profile.setPostCode(setting.getPostCode());
        profile.setEmailAddress(setting.getEmailAddress());
        profile.setTelephone(setting.getTelephone());
        profile.setMobile(setting.getMobile());
        profile.setNameOnEmailAddress(setting.getEmailSenderName());
        profile.setSenderEmailAddress(setting.getSenderEmailAddress());
        profile.setSignatureImageName(setting.getSignatureImageName());
        profile.setCompEmailHost(setting.getCompEmailHost());
        profile.setCompEmailPort(setting.getCompEmailPort());
        profile.setCompEmailUserName(setting.getCompEmailUserName());
        profile.setCompEmailPassword(setting.getCompEmailPassword());
        profile.setCompEmailDisplayName(setting.getCompEmailDisplayName());
        profile.setIsActive(setting.getIsActive());
        return profile;
    }

    // 辅助方法：将 CompanyProfile 转换为 GeneralSetting
    private GeneralSetting mapToGeneralSetting(CompanyProfile profile) {
        GeneralSetting setting = new GeneralSetting();
        setting.setId(profile.getId());
        setting.setCompanyName(profile.getCompanyName());
        setting.setOrganizationalNumber(profile.getOrganizationalNumber());
        setting.setAddress(profile.getAddress());
        setting.setOwnerName(profile.getOwnerName());
        setting.setPostCode(profile.getPostCode());
        setting.setEmailAddress(profile.getEmailAddress());
        setting.setTelephone(profile.getTelephone());
        setting.setMobile(profile.getMobile());
        setting.setEmailSenderName(profile.getNameOnEmailAddress());
        setting.setSenderEmailAddress(profile.getSenderEmailAddress());
        setting.setSignatureImageName(profile.getSignatureImageName());
        setting.setCompEmailHost(profile.getCompEmailHost());
        setting.setCompEmailPort(profile.getCompEmailPort());
        setting.setCompEmailUserName(profile.getCompEmailUserName());
        setting.setCompEmailPassword(profile.getCompEmailPassword());
        setting.setCompEmailDisplayName(profile.getCompEmailDisplayName());
        setting.setIsActive(profile.getIsActive());
        return setting;
    }
}
