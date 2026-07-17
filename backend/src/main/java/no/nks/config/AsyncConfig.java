package no.nks.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 异步处理配置类
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 配置异步任务执行器
     * - 有限队列防止OOM
     * - 拒绝策略：CallerRunsPolicy将任务回退给调用线程执行，防止任务丢失
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);         // 核心线程数
        executor.setMaxPoolSize(10);         // 最大线程数
        executor.setQueueCapacity(25);       // 队列容量
        executor.setThreadNamePrefix("NBK-Async-");  // 线程名前缀
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy()); // 拒绝策略：调用者运行
        executor.setWaitForTasksToCompleteOnShutdown(true); // 关闭时等待任务完成
        executor.setAwaitTerminationSeconds(60); // 最多等待60秒
        executor.initialize();
        return executor;
    }

    /**
     * 项目详情执行器
     * - 防止OOM：有限队列，明确的拒绝策略
     * - 线程数与CPU核心数相关，更高效利用资源
     */
    @Bean(name = "projectDetailExecutor")
    public ExecutorService projectDetailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int poolSize = Math.max(2, Runtime.getRuntime().availableProcessors() / 2);
        executor.setCorePoolSize(poolSize);
        executor.setMaxPoolSize(poolSize); // 对于FixedThreadPool特性，core和max通常一致
        executor.setQueueCapacity(10); // 设置一个合理的队列容量
        executor.setThreadNamePrefix("ProjectDetail-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy()); // 拒绝策略：调用者运行
        executor.setWaitForTasksToCompleteOnShutdown(true); // 关闭时等待任务完成
        executor.setAwaitTerminationSeconds(60); // 最多等待60秒
        executor.initialize();
        return executor.getThreadPoolExecutor(); // 返回实际的ExecutorService
    }

    /**
     * 数据库回调执行器
     * - 替代PartyDocServiceImpl中手动创建的线程池
     * - 有限队列和拒绝策略防止OOM
     * - 优雅关闭配置确保任务完成
     */
    @Bean(name = "dbCallbackExecutor")
    public ExecutorService dbCallbackExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);          // 核心线程数
        executor.setMaxPoolSize(10);          // 最大线程数
        executor.setQueueCapacity(100);       // 队列容量有限，防止OOM
        executor.setThreadNamePrefix("DB-Callback-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy()); // 拒绝策略：调用者运行
        executor.setWaitForTasksToCompleteOnShutdown(true); // 关闭时等待任务完成
        executor.setAwaitTerminationSeconds(60); // 最多等待60秒
        executor.initialize();
        return executor.getThreadPoolExecutor();
    }
}
