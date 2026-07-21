-- 原 Mobile App ProjectDetail 硬编码取 Party.Doc.PartyDocTypeID = 64 作为平面图(Plantegning)。
-- DocName 对齐旧前端 mock：「Tegning som viser slukplassering i plan og høyde」。
-- 仅插入 ID=64 一条（App 不认其它自增 ID）。优先挂到已有项目参与方使用的 PartyType。

SET IDENTITY_INSERT [Party].[DocType] ON;

IF NOT EXISTS (SELECT 1 FROM [Party].[DocType] WHERE [ID] = 64)
BEGIN
    DECLARE @partyTypeId INT = NULL;
    DECLARE @companyId INT = NULL;

    -- 优先：已有项目参与方上的 PartyType（更可能出现在 Foretak 上传页）
    SELECT TOP 1
        @partyTypeId = pp.[PartyTypeID],
        @companyId = p.[CompanyID]
    FROM [nbkUser].[ProjectParty] pp
    INNER JOIN [nbkUser].[Project] p ON p.[ID] = pp.[ProjectID]
    WHERE pp.[PartyTypeID] IS NOT NULL
    ORDER BY pp.[ID];

    IF @partyTypeId IS NULL
    BEGIN
        SELECT TOP 1
            @partyTypeId = pt.[ID],
            @companyId = pt.[CompanyID]
        FROM [Party].[PartyType] pt
        ORDER BY pt.[ID];
    END

    IF @partyTypeId IS NULL
        SET @partyTypeId = 1;

    IF @companyId IS NULL
        SET @companyId = 1;

    INSERT INTO [Party].[DocType] ([ID], [PartyTypeID], [DocName], [isRequired], [SortOrder], [CompanyID])
    VALUES (
        64,
        @partyTypeId,
        N'Tegning som viser slukplassering i plan og høyde',
        1,
        0,
        @companyId
    );
END

SET IDENTITY_INSERT [Party].[DocType] OFF;
