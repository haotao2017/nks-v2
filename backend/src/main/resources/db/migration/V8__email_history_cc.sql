-- 工作流邮件抄送需落库，Done 回看与排查才有依据。
IF COL_LENGTH('nbkUser.EmailHistory', 'Cc') IS NULL
BEGIN
    ALTER TABLE [nbkUser].[EmailHistory] ADD [Cc] NVARCHAR(500) NULL;
END
GO
