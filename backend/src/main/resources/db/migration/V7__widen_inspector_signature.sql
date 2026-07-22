-- 手写签名以 base64 data URL 随 ProjectSubmit 入库，NVARCHAR(100) 不够会触发截断/DataAccessException。
ALTER TABLE [nbkUser].[Project] ALTER COLUMN [InspectorSignature] NVARCHAR(MAX) NULL;
