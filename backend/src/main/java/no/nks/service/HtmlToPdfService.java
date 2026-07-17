package no.nks.service;

import java.io.InputStream;

public interface HtmlToPdfService {
    InputStream convertHtmlToPdf(String htmlContent);
    String convertHtmlToPdfAndUpload(String htmlContent, String fileName, Integer companyId);
}
