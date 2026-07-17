-- V3: 加宽 nbkUser.Users.Password 列以容纳 bcrypt 密文(60 字符)。
--
-- 背景:旧列为 NVARCHAR(50),存 DES/Base64 密文;重写后登录成功会把密码平滑迁移为 bcrypt($2...),
-- bcrypt 密文长 60 字符,当前列宽会导致迁移写库失败(已被 PasswordMigrationService 隔离,不阻断登录)。
--
-- ⚠️ 默认不执行:ALTER COLUMN 必须显式给出可空性,写错会改变现有 NOT NULL/NULL 约束。
--    连到目标 RDS 后,先确认该列的实际可空性,再取消下面对应一行的注释启用本迁移。
--
-- 若该列当前为 NOT NULL:
-- ALTER TABLE nbkUser.Users ALTER COLUMN Password NVARCHAR(255) NOT NULL;
--
-- 若该列当前允许 NULL:
-- ALTER TABLE nbkUser.Users ALTER COLUMN Password NVARCHAR(255) NULL;

-- 占位(无操作),使 Flyway 记录该版本;启用时改为上面二选一。
SELECT 1;
