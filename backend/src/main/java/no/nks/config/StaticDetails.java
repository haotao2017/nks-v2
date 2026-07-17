package no.nks.config;

public class StaticDetails {
    // S3 常量
    public static final String S3_BUCKET_FOLDER_FOR_HTML_TO_PDF_HEADER_IMAGE_WHITE = "PdfHeaderTopHide.png";
    public static final String S3_BUCKET_FOLDER_FOR_PDF = "Files/";
    public static final String S3_BUCKET_FOLDER_FOR_INSPECTION_CHECKLIST_IMAGES = "ChecklistTypeImages/";
    public static final String S3_BUCKET_FOLDER_FOR_INSPECTION_THIRD_PARTY_PDF = "DevChecklistPdfs/";
    public static final String S3_BUCKET_FOLDER_FOR_CALANDER_ICS = "ICS/";
    public static final String S3_BUCKET_FOLDER_FOR_PDF_HTML_FILES = "PdfHtml/";
    public static final String S3_BUCKET_FOLDER_FOR_PROJECT_SITE_IMAGES = "ProjectSiteImages/";

    // S3文件夹路径常量
    public static final String S3FolderProjects = "projects";
    public static final String S3FolderProjectInspection = "project-inspection";
    public static final String S3FolderProjectDocuments = "project-documents";
    public static final String S3FolderCompanyLogo = "company-logo";
    public static final String S3FolderUserProfilePicture = "user-profile-pictures";

    // PDF文件相关常量
    public static final String DEFAULT_PDF_NAME = "HtmlToPdf.pdf";
    public static final String S3_BUCKET_STEP_TWO_PDF_SAMPLE_FILE_NAME = "Sample.pdf";
    public static final String S3_BUCKET_STEP_TWELVE_PDF_SAMPLE_FILE_NAME = "Kontrollerklæring NBK.pdf";
    public static final String S3_BUCKET_STEP_RUNE_SIGNATURE_IMG_NAME = "RuneSignature.jpg";
    public static final String S3_BUCKET_STEP_NINE_RUNE_SIGNATURE_IMG_NAME = "RuneSignaturePDFSecond.jpg";

    // HTML文件相关常量
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_FILE_MAIN = "Main.html";
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_FILE_FINAL_REPORT = "FinalReport.html";
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_FILE_CHECK_LIST_ITEM = "CheckListItem.html";
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_FILE_CHECKLIST_IMAGE_TYPE = "ChecklistImageType.html";
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_FILE_CHECKLIST_IMAGE = "ChecklistImage.html";
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_FILE_CHECKLIST = "Checklist.html";

    // 图片相关常量
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_IMAGE_MAIN_LOGO = "logoNosk.jpg";
    public static final String S3_BUCKET_FOLDER_FOR_FINAL_REPORT_PDF_HTML_IMAGE_BACKGROUND = "FinalReportPdfBackgroundImage.jpg";
}
