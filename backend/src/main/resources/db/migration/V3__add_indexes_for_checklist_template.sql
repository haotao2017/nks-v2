-- 为ChecklistTemplate表添加索引
-- 添加CompanyID索引，因为经常按CompanyID筛选
CREATE INDEX idx_checklist_template_company_id ON nbkUser.ChecklistTemplate (CompanyID);

-- -- 添加Title+CompanyID复合索引，优化按名称和公司ID查询
-- CREATE INDEX idx_checklist_template_title_company ON nbkUser.ChecklistTemplate (Title, CompanyID);

-- 为ChecklistItemTemplate表添加索引
-- 添加ChecklistId索引，优化查找模板下所有项目
CREATE INDEX idx_checklist_item_template_checklist_id ON nbkUser.ChecklistItemTemplate (ChecklistId);

-- 添加ChecklistId+CompanyID复合索引，经常同时筛选
CREATE INDEX idx_checklist_item_company_checklist ON nbkUser.ChecklistItemTemplate (ChecklistId, CompanyID);

-- 为Service表添加索引
-- 优化按ChecklistTempId查询服务
CREATE INDEX idx_service_checklist_temp_id ON nbkUser.Service (ChecklistTempId);

-- 添加ChecklistTempId+CompanyID复合索引
CREATE INDEX idx_service_checklist_company ON nbkUser.Service (ChecklistTempId, CompanyID);
