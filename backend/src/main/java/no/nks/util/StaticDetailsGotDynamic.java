package no.nks.util;

import no.nks.entity.CompanyWrapper;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class StaticDetailsGotDynamic {
    private final CompanyWrapper companyWrapper;

    public String s3BucketName() {
        return "nksystem-files";
    }

    public String s3UrlStaticPart() {
        return ".s3.amazonaws.com/";
    }

    public String s3CompanyFolder() {
        return "company/" + companyWrapper.getCompanyID();
    }

    public String s3BucketFolderForPDF() {
        return "company/" + companyWrapper.getCompanyID() + "/Resources/Files/Docs/";
    }

    public String s3BucketFolderForPDF_WithoutMain() {
        return "/Resources/Files/Docs/";
    }

    public String s3BucketFolderForFinalReportPDF() {
        return "company/" + companyWrapper.getCompanyID() + "/Resources/Files/FinalReports/";
    }

    public String s3BucketFolderForFinalReportPDF_WithoutMain() {
        return "/Resources/Files/FinalReports/";
    }

    public String s3BucketFolderForInspectionChecklistImages() {
        return "company/" + companyWrapper.getCompanyID() + "/Resources/ChecklistTypeImages";
    }

    public String s3BucketFolderForInspectionChecklistImages_WithoutMain() {
        return "/Resources/ChecklistTypeImages/";
    }

    public String s3BucketFolderForInspectionThirdPartyPDF() {
        return "company/" + companyWrapper.getCompanyID() + "/Resources/DevChecklistPdfs";
    }

    public String s3BucketFolderForInspectionThirdPartyPDF_WithoutMain() {
        return "/Resources/DevChecklistPdfs/";
    }

    public String s3BucketFolderForFinalReportPDF_HTML_Files() {
        return "company/" + companyWrapper.getCompanyID() + "/Resources/PdfHtml";
    }

    public String s3BucketFolderForFinalReportPDF_HTML_Files_WithoutMain() {
        return "/Resources/PdfHtml/";
    }
}
