package no.nks.service.impl;

import com.itextpdf.html2pdf.ConverterProperties;
import com.itextpdf.html2pdf.HtmlConverter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import no.nks.config.StaticDetails;
import no.nks.service.HtmlToPdfService;
import no.nks.service.S3Service;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class HtmlToPdfServiceImpl implements HtmlToPdfService {

    private final S3Service s3Service;

    @Override
    public InputStream convertHtmlToPdf(String htmlContent) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdf = new PdfDocument(writer);

            ConverterProperties properties = new ConverterProperties();
            HtmlConverter.convertToPdf(htmlContent, pdf, properties);

            // Get the PDF as a byte array
            byte[] pdfBytes = outputStream.toByteArray();
            return new ByteArrayInputStream(pdfBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error converting HTML to PDF", e);
        }
    }

    @Override
    public String convertHtmlToPdfAndUpload(String htmlContent, String fileName, Integer companyId) {
        try {
            // 使用时间戳为文件命名，避免覆盖
            if (fileName == null || fileName.isEmpty()) {
                String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
                fileName = "HtmlToPdf_" + timestamp + ".pdf";
            } else if (!fileName.toLowerCase().endsWith(".pdf")) {
                // 确保文件名有.pdf后缀
                fileName = fileName + ".pdf";
            }

            // Get company-specific bucket and folder information
            String bucketFolder = s3Service.getCompanyS3Folder(companyId) + StaticDetails.S3_BUCKET_FOLDER_FOR_PDF;

            // Convert HTML to PDF
            InputStream pdfStream = convertHtmlToPdf(htmlContent);

            // Upload to S3
            String uploadResult = s3Service.uploadFileFromStream(bucketFolder, pdfStream, fileName);

            if (!"Success".equals(uploadResult)) {
                throw new RuntimeException("Failed to upload PDF to S3: " + uploadResult);
            }

            // Generate public URL
            String urlStaticPart = s3Service.getCompanyS3UrlStaticPart(companyId);
            // 固定桶名已经在S3Service中处理，传null或任何值都会被忽略
            String pdfUrl = s3Service.createPublicUrl(null, urlStaticPart, bucketFolder, fileName);

            return pdfUrl;
        } catch (Exception e) {
            throw new RuntimeException("Error in PDF conversion and upload process", e);
        }
    }
}
