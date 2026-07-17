-- V1 baseline (空基线 / 占位)
--
-- 全新空库: baseline-on-migrate=false, Flyway 从本脚本开始执行。
--   本脚本刻意为空(占位), 真正的建表在 V2__create_all_tables.sql。
--
-- 旧库(schema 已由外部维护、已含全部表): 请改用 baseline-on-migrate=true
--   + baseline-version=2, 使 Flyway 把旧库标记为已迁移到 V2, 从而跳过
--   V1/V2, 仅应用 V3(索引)、V4(密码列加宽)等后续增量。
SELECT 1;
