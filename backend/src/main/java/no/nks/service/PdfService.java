package no.nks.service;

import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.entity.PostNumber;
import no.nks.entity.Project;
import no.nks.entity.Service;
import no.nks.entity.GeneralSetting;

import java.util.List;

public interface PdfService {

    class PdfTemplateData {
        public Project project;
        public List<Service> services;
        public PostNumber postNumber;
        public GeneralSetting settings;

        public PdfTemplateData(Project project, List<Service> services, PostNumber postNumber, GeneralSetting settings) {
            this.project = project;
            this.services = services;
            this.postNumber = postNumber;
            this.settings = settings;
        }
    }
    String generatePdfForStepTwo(ProjectWorkflowDto param, PdfTemplateData data) throws Exception;

    String generatePdfForStepThirteen(ProjectWorkflowDto param, PdfTemplateData data) throws Exception;

    String generatePdfForStepFourteen(ProjectWorkflowDto param, PdfTemplateData data) throws Exception;
}
