package no.nks.controller;

import jakarta.persistence.EntityNotFoundException;
import no.nks.dto.PostCodeDto;
import no.nks.dto.WrapperPostCodeDto;
import no.nks.service.MiscellaneousService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 杂项控制器，处理邮政编码等不属于其他控制器的功能
 */
@RestController
@RequestMapping("/api/Miscellaneous")
public class MiscellaneousController {

    private final MiscellaneousService miscellaneousService;
    private static final Logger logger = LoggerFactory.getLogger(MiscellaneousController.class);

    @Autowired
    public MiscellaneousController(MiscellaneousService miscellaneousService) {
        this.miscellaneousService = miscellaneousService;
    }

    /**
     * 获取所有邮政编码信息
     * @return 包含所有邮政编码的响应
     */
    @GetMapping("/GetPostCodes")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPostCodes() {
        try {
            // 验证当前用户的 JWT 令牌
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            // 获取所有邮政编码
            WrapperPostCodeDto result = miscellaneousService.getAllPostCodes();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch post codes: " + e.getMessage());
        }
    }

    /**
     * 根据邮政编码获取单个邮政编码信息
     * @param postNumber 邮政编码
     * @return 邮政编码信息
     */
    @GetMapping("/GetPostCodeByNumber/{postNumber}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPostCodeByNumber(@PathVariable String postNumber) {
        try {
            // 验证当前用户的 JWT 令牌
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            // 获取特定邮政编码
            PostCodeDto result = miscellaneousService.getPostCodeByPostNumber(postNumber);
            return ResponseEntity.ok(result);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch post code: " + e.getMessage());
        }
    }
}
