-- V5: 真正加宽 nbkUser.Users.Password 以容纳 bcrypt(~60 字符)。
--
-- 背景:
--   V4 仅为占位(SELECT 1),因旧库列可空性需人工确认而未执行 ALTER。
--   V2 新库建表已是 NVARCHAR(255);遗留/共享旧库仍可能是 NVARCHAR(50)。
--   Entity.User.Password length 已改为 255;本迁移对 SQL Server 强制对齐列宽。
--
-- 可空性:对齐 V2 与遗留常见定义,使用 NULL。
-- 仅当当前列宽不足以容纳 bcrypt 时才 ALTER(幂等友好)。

IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = N'nbkUser'
      AND t.name = N'Users'
      AND c.name = N'Password'
      AND c.max_length > 0
      AND c.max_length < 510  -- NVARCHAR(n) 的 max_length = n*2;255*2=510
)
BEGIN
    ALTER TABLE nbkUser.Users ALTER COLUMN [Password] NVARCHAR(255) NULL;
END;
