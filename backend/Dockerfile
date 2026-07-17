# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# 先拷贝 wrapper 与 pom,利用层缓存预拉依赖
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline

# 再拷贝源码构建
COPY src/ src/
RUN ./mvnw -q -B -DskipTests clean package \
    && cp target/*.jar app.jar

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# 非 root 运行
RUN groupadd --system nks && useradd --system --gid nks --home /app nks
COPY --from=build /app/app.jar app.jar
RUN chown -R nks:nks /app
USER nks

# Spring Boot 默认 8080
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
ENV SPRING_PROFILES_ACTIVE=prod

# 简单健康探针(容器编排也会用 ALB /health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
