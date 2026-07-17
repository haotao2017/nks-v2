package no.nks.service;

import no.nks.entity.CompanyProfile;
import no.nks.entity.DocFolders;
import no.nks.entity.S3Bucket;
import no.nks.entity.WrapperCompanyProfile;
import no.nks.entity.WrapperMultiCompanyProfile;

import java.util.List;

public interface CompanyProfileService {

    WrapperCompanyProfile getProfile(int companyID);

    WrapperMultiCompanyProfile getAllProfiles();

    CompanyProfile update(CompanyProfile companyProfile, boolean isSystemOwner);

    CompanyProfile add(CompanyProfile companyProfile);

    S3Bucket getBucketDetail();

    S3Bucket updateS3Bucket(S3Bucket s3bucket);

    List<DocFolders> getAllCompaniesFolders();

    DocFolders getSingleCompanyFolder(int companyID);

    DocFolders updateSingleCompanyFolder(DocFolders docFolders);

    DocFolders addCompanyFolder(DocFolders docFolders);
}
