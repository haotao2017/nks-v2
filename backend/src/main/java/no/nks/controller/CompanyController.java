package no.nks.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.entity.CompanyProfile;
import no.nks.entity.DocFolders;
import no.nks.entity.S3Bucket;
import no.nks.entity.User;
import no.nks.entity.WrapperCompanyProfile;
import no.nks.entity.WrapperDocFolders;
import no.nks.entity.WrapperMultiCompanyProfile;
import no.nks.entity.WrapperS3Bucket;
import no.nks.service.CompanyProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/Company")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyProfileService companyProfileService;

    @GetMapping("/GetProfile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProfile(@RequestParam int CompanyID, @AuthenticationPrincipal User user) {
        log.info("GetProfile called for company ID: {}", CompanyID);

        if (user == null || user.getCompanyID() == null) {
            log.warn("User details or CompanyID not available for getProfile request");
            throw new AccessDeniedException("User authentication error or CompanyID missing");
        }

        WrapperCompanyProfile data = companyProfileService.getProfile(CompanyID);
        return ResponseEntity.ok(data);
    }

    @PutMapping("/UpdateProfile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(@RequestBody WrapperCompanyProfile userParam, @AuthenticationPrincipal User user) {
        log.info("UpdateProfile called for company ID: {}", userParam.getCompanyProfile().getId());

        if (user == null || user.getCompanyID() == null) {
            log.warn("User details or CompanyID not available for updateProfile request");
            throw new AccessDeniedException("User authentication error or CompanyID missing");
        }

        // 验证当前用户是否有权限修改该公司信息
        boolean isAuthorized = user.getCompanyID().equals(userParam.getCompanyProfile().getId())
                || Boolean.TRUE.equals(user.getIsSystemOwner());

        if (!isAuthorized) {
            log.warn("User with companyID {} is not authorized to update company with ID {}",
                    user.getCompanyID(), userParam.getCompanyProfile().getId());
            throw new AccessDeniedException("Not authorized to update this company profile");
        }

        CompanyProfile data = companyProfileService.update(userParam.getCompanyProfile(),
                Boolean.TRUE.equals(user.getIsSystemOwner()));
        return ResponseEntity.ok(data);
    }

    @PutMapping("/AddNewCompanyProfile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addNewCompanyProfile(@RequestBody WrapperCompanyProfile userParam, @AuthenticationPrincipal User user) {
        log.info("AddNewCompanyProfile called");

        if (user == null) {
            log.warn("User details not available for addNewCompanyProfile request");
            throw new AccessDeniedException("User authentication error");
        }

        // 只有系统管理员可以添加新公司
        if (!Boolean.TRUE.equals(user.getIsSystemOwner())) {
            log.warn("User with ID {} is not a system owner, cannot add new company", user.getId());
            throw new AccessDeniedException("Only system owners can add new companies");
        }

        CompanyProfile data = companyProfileService.add(userParam.getCompanyProfile());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/GetAllProfiles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllProfiles(@AuthenticationPrincipal User user) {
        log.info("GetAllProfiles called");

        if (user == null) {
            log.warn("User details not available for getAllProfiles request");
            throw new AccessDeniedException("User authentication error");
        }

        // 只有系统管理员可以查看所有公司信息
        if (!Boolean.TRUE.equals(user.getIsSystemOwner())) {
            log.warn("User with ID {} is not a system owner, cannot view all company profiles", user.getId());
            throw new AccessDeniedException("Only system owners can view all company profiles");
        }

        WrapperMultiCompanyProfile data = companyProfileService.getAllProfiles();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/CheckForSystemOwnerStatus")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> checkForSystemOwnerStatus(@AuthenticationPrincipal User user) {
        log.info("CheckForSystemOwnerStatus called");

        if (user == null) {
            log.warn("User details not available for checkForSystemOwnerStatus request");
            throw new AccessDeniedException("User authentication error");
        }

        boolean isSystemOwner = Boolean.TRUE.equals(user.getIsSystemOwner());
        return ResponseEntity.ok(isSystemOwner);
    }

    // 文件夹相关接口
    @GetMapping("/GetBucketDetail")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getBucketDetail(@AuthenticationPrincipal User user) {
        log.info("GetBucketDetail called");

        if (user == null) {
            log.warn("User details not available for getBucketDetail request");
            throw new AccessDeniedException("User authentication error");
        }

        S3Bucket data = companyProfileService.getBucketDetail();
        return ResponseEntity.ok(data);
    }

    @PutMapping("/UpdateS3Bucket")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateS3Bucket(@RequestBody WrapperS3Bucket wrapper, @AuthenticationPrincipal User user) {
        log.info("UpdateS3Bucket called for bucket ID: {}", wrapper.getS3bucket().getId());

        if (user == null) {
            log.warn("User details not available for updateS3Bucket request");
            throw new AccessDeniedException("User authentication error");
        }

        // 只有系统管理员可以更新 S3 存储桶信息
        if (!Boolean.TRUE.equals(user.getIsSystemOwner())) {
            log.warn("User with ID {} is not a system owner, cannot update S3 bucket", user.getId());
            throw new AccessDeniedException("Only system owners can update S3 bucket settings");
        }

        S3Bucket data = companyProfileService.updateS3Bucket(wrapper.getS3bucket());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/GetAllCompaniesFolders")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllCompaniesFolders(@AuthenticationPrincipal User user) {
        log.info("GetAllCompaniesFolders called");

        if (user == null) {
            log.warn("User details not available for getAllCompaniesFolders request");
            throw new AccessDeniedException("User authentication error");
        }

        // 只有系统管理员可以查看所有公司文件夹
        if (!Boolean.TRUE.equals(user.getIsSystemOwner())) {
            log.warn("User with ID {} is not a system owner, cannot view all company folders", user.getId());
            throw new AccessDeniedException("Only system owners can view all company folders");
        }

        List<DocFolders> data = companyProfileService.getAllCompaniesFolders();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/GetSingleCompanyFolder")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getSingleCompanyFolder(@RequestParam int CompanyID, @AuthenticationPrincipal User user) {
        log.info("GetSingleCompanyFolder called for company ID: {}", CompanyID);

        if (user == null) {
            log.warn("User details not available for getSingleCompanyFolder request");
            throw new AccessDeniedException("User authentication error");
        }

        // 只有系统管理员可以查看指定公司文件夹
        if (!Boolean.TRUE.equals(user.getIsSystemOwner())) {
            log.warn("User with ID {} is not a system owner, cannot view folder for company ID {}", user.getId(), CompanyID);
            throw new AccessDeniedException("Only system owners can view company folders");
        }

        DocFolders data = companyProfileService.getSingleCompanyFolder(CompanyID);
        return ResponseEntity.ok(data);
    }

    @PutMapping("/UpdateSingleCompanyFolder")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateSingleCompanyFolder(@RequestBody WrapperDocFolders wrapper, @AuthenticationPrincipal User user) {
        log.info("UpdateSingleCompanyFolder called for folder ID: {}", wrapper.getDocFolders().getId());

        if (user == null) {
            log.warn("User details not available for updateSingleCompanyFolder request");
            throw new AccessDeniedException("User authentication error");
        }

        // 只有系统管理员可以更新公司文件夹
        if (!Boolean.TRUE.equals(user.getIsSystemOwner())) {
            log.warn("User with ID {} is not a system owner, cannot update company folder", user.getId());
            throw new AccessDeniedException("Only system owners can update company folders");
        }

        DocFolders data = companyProfileService.updateSingleCompanyFolder(wrapper.getDocFolders());
        return ResponseEntity.ok(data);
    }

    @PutMapping("/AddCompanyFolder")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addCompanyFolder(@RequestBody WrapperDocFolders wrapper, @AuthenticationPrincipal User user) {
        log.info("AddCompanyFolder called for company ID: {}", wrapper.getDocFolders().getCompanyId());

        if (user == null) {
            log.warn("User details not available for addCompanyFolder request");
            throw new AccessDeniedException("User authentication error");
        }

        // 只有系统管理员可以添加公司文件夹
        if (!Boolean.TRUE.equals(user.getIsSystemOwner())) {
            log.warn("User with ID {} is not a system owner, cannot add company folder", user.getId());
            throw new AccessDeniedException("Only system owners can add company folders");
        }

        DocFolders data = companyProfileService.addCompanyFolder(wrapper.getDocFolders());
        return ResponseEntity.ok(data);
    }
}
