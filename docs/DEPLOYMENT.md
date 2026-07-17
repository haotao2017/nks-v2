# NKS v2 AWS 部署记录

**账号** 246710929963 · **区域** eu-north-1(斯德哥尔摩)· **部署方式** 单台 EC2 + Docker Compose
**标签隔离** 所有资源带 `Project=nks-v2`,`nks-` 前缀,不影响其它项目。

## 访问入口
- 管理后台(Admin):  **http://16.170.55.219**(未登录自动跳 /login)
- 后端 API:          **http://16.170.55.219:8080**(健康检查 `/health`)

> 当前是 HTTP(无域名/证书)。上线正式域名再加 ACM + HTTPS。

## 新建的 AWS 资源

| 资源 | 标识 | 作用 |
|---|---|---|
| S3 桶 | `nks-files-246710929963` | 存 PDF 报告 / 检查项图片 / 户型图等(私有 + AES256 加密 + 阻断公开访问) |
| 安全组 | `sg-0d6db82fc7d890edf`(nks-sg) | 放行 22/80/443/8080;SQL Server 1433 **不对外**,仅容器内网 |
| EC2 密钥对 | `nks-key` | SSH 登录(私钥 pem 在本机 scratchpad,见下) |
| 弹性公网 IP | `eipalloc-0892076096d702de4` = **16.170.55.219** | 固定公网地址 |
| EC2 实例 | `i-0732076c2202dbf8a`(t3.large / AL2023 / 30GB gp3) | 承载全部容器 |
| IAM 角色 | `nks-ec2-role`(内联策略 `nks-s3-access`) | EC2 访问 S3(仅 `nks-files-*` 桶),后端经 IMDS 自动取临时凭证,**无长期 key** |
| 实例配置文件 | `nks-ec2-profile` | 把上面角色挂到 EC2;IMDS 跳数已设 2(让容器可取凭证) |

> 网络用账号**默认 VPC** `vpc-024fb9c8e8d4909a1`(未新建 VPC,复用默认;子网 subnet-032d30a7bb81e818b)。
> S3 访问已验证:主机经实例角色成功列桶 / 上传 / 删除测试对象。

## 后台登录账号(已 seed)
- 地址:http://16.170.55.219  ·  用户名:**admin**  ·  密码:见部署时的私下交付(默认口令未写入仓库)。
- 首次登录后密码会保持 bcrypt;**请尽快在后台改成你自己的强密码**。
- 同时 seed 了一个公司 `NKS`(GeneralSetting id=1,SystemOwner),admin 属于它。

## EC2 上的 Docker 容器(docker compose,目录 ~/nks/deploy)
| 容器 | 镜像 | 作用 | 端口 |
|---|---|---|---|
| `nks-mssql` | mcr.microsoft.com/mssql/server:2022(Express,免费) | 数据库(数据卷 `mssql-data` 持久化) | 1433(仅内网) |
| `nks-db-init` | 同上(一次性) | 启动时建库 `nks`(幂等) | — |
| `nks-backend` | 本地构建(Spring Boot 3.4.5 / Java21) | 后端 API,`SPRING_PROFILES_ACTIVE=prod` | 8080→8080 |
| `nks-admin` | 本地构建(Next.js 16) | 管理后台 | 80→3000 |

**数据库**:全新库 `nks`,后端启动时 **Flyway 自动建表**(schema `nbkUser`,28 张表 + 索引),已验证 4 个迁移全部成功。

## 密钥位置(不入库)
- EC2 私钥:本机 scratchpad `nks-key.pem`(SSH:`ssh -i nks-key.pem ec2-user@16.170.55.219`)
- 运行时密钥(SA 密码 / JWT secret,随机生成):EC2 上 `~/nks/deploy/.env`;本机备份 scratchpad `nks.env`

## 待办(核心已全部跑通;以下为增强)
1. ✅ ~~数据库空 / 无法登录~~ —— 已 seed admin 账号(见上),登录已验证返回 JWT。
2. ✅ ~~S3 凭证缺失~~ —— 已用实例角色 `nks-ec2-role` 打通并验证。
3. **HTTPS/域名**:当前 HTTP。绑域名后加 ACM 证书 + 反向代理/ALB。
4. **SMTP / Tripletex**:`.env` 未配(邮件/开票功能需要真实凭证)。
5. **SSH 22 对全网开放**:建议收敛到你的固定 IP。
6. **改默认密码**:admin/Admin123! 尽快改。

## 更新部署(改代码后)
在本机 nks-v2 重新打包 `backend`/`apps/admin`/`packages` scp 到 EC2 `~/nks`,再 `cd ~/nks/deploy && docker compose up -d --build`。
