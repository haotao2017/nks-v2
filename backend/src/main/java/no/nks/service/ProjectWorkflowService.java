package no.nks.service;

import no.nks.dto.RequestResponse;
import no.nks.dto.workflow.ProjectWorkflowDto;
import no.nks.dto.workflow.WrapperMultiProjectWorkflowDto;
import no.nks.dto.workflow.WrapperProjectWorkflowDto;
import no.nks.dto.workflow.WrapperProjectInvoiceDataDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProjectWorkflowService {

    WrapperMultiProjectWorkflowDto getProjectWorkflowStep(Integer projectId, Integer workflowId, Integer workflowStepId);

    WrapperMultiProjectWorkflowDto getProjectWorkflowCompletedTransferedSteps(Integer projectId, Integer workflowId);

    WrapperProjectWorkflowDto getProjectWFOneEmailFormated(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFOne(ProjectWorkflowDto projectWorkflow, Integer companyId);

    WrapperProjectWorkflowDto getProjectWFTwoEmailFormated(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFTwo(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId);

    RequestResponse projectWFThree(ProjectWorkflowDto projectWorkflow, List<MultipartFile> files, Integer companyId);

    WrapperProjectWorkflowDto getProjectWFThree(ProjectWorkflowDto projectWorkflow);

    WrapperProjectWorkflowDto getProjectWFFourEmailFormated(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFFour(ProjectWorkflowDto projectWorkflow, Integer companyId);

    RequestResponse projectWFGeneric(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFFive(ProjectWorkflowDto projectWorkflow, Integer companyId);

    RequestResponse projectWFSix(ProjectWorkflowDto projectWorkflow, Integer companyId);

    RequestResponse projectWFSeven(ProjectWorkflowDto projectWorkflow, Integer companyId);

    RequestResponse projectWFEightTransfer(ProjectWorkflowDto projectWorkflow);

    WrapperProjectWorkflowDto getProjectWFEightEmailFormated(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFEightSendEmail(ProjectWorkflowDto projectWorkflow, Integer companyId);

    RequestResponse projectWFNineTransfer(ProjectWorkflowDto projectWorkflow);

    WrapperProjectWorkflowDto getProjectWFNineEmailFormated(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFNineSendEmail(ProjectWorkflowDto projectWorkflow, Integer companyId);

    RequestResponse projectWFTenTransfer(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFTen(ProjectWorkflowDto projectWorkflow, Integer companyId);

    RequestResponse projectWFElevenDone(ProjectWorkflowDto projectWorkflow);

    WrapperProjectWorkflowDto getProjectWFTwelveEmailFormated(ProjectWorkflowDto projectWorkflow);

    RequestResponse projectWFTwelve(ProjectWorkflowDto projectWorkflow, Integer companyId);

    WrapperProjectWorkflowDto getProjectWFThirteenEmailFormated(ProjectWorkflowDto projectWorkflow) throws Exception;

    RequestResponse projectWFThirteen(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId);

    WrapperProjectWorkflowDto getProjectWFFourteenEmailFormated(ProjectWorkflowDto projectWorkflow) throws Exception;

    RequestResponse projectWFFourteen(ProjectWorkflowDto projectWorkflow, MultipartFile file, Integer companyId);

    WrapperProjectInvoiceDataDto projectWFFifteenGetDetails(Integer projectId, Integer companyId);

    RequestResponse projectWFFifteen(ProjectWorkflowDto projectWorkflow);

    RequestResponse updateProjectWFTwoStepOne(ProjectWorkflowDto projectWorkflow, Integer companyId);

    WrapperProjectWorkflowDto getProjectWFTwoStepOne(ProjectWorkflowDto projectWorkflow, Integer companyId);

    void updateProjectFinalReportPdfDate(Integer projectId);

    void updateProjectInvoiceSetDate(Integer projectId);
}
