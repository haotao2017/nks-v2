package no.nks.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * AWS SDK v2 配置。
 *
 * <p>凭证策略（现代化）：优先使用 {@link DefaultCredentialsProvider}，从而支持
 * IAM Role（EC2/ECS/EKS）、环境变量、共享凭证文件等标准来源；仅当在配置中
 * 显式提供了非空的 {@code aws.access-key-id} 与 {@code aws.secret-key} 时，
 * 才回退到 {@link StaticCredentialsProvider}。region 从 {@code aws.region} 读取。</p>
 */
@Configuration
public class AwsConfig {

    @Value("${aws.access-key-id:}")
    private String accessKeyId;

    @Value("${aws.secret-key:}")
    private String secretKey;

    @Value("${aws.region:eu-north-1}")
    private String region;

    /**
     * 构建凭证提供者：显式静态密钥优先级最低，仅在同时配置了 accessKeyId 与 secretKey
     * 时启用；否则使用默认凭证链（IAM Role 优先）。
     */
    private AwsCredentialsProvider credentialsProvider() {
        if (StringUtils.hasText(accessKeyId) && StringUtils.hasText(secretKey)) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKeyId, secretKey));
        }
        return DefaultCredentialsProvider.create();
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider())
                .build();
    }
}
