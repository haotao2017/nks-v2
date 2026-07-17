import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// 按域拆分的翻译片段(每个文件持有互不相交的顶层 section,浅合并即可)。
// 新增模块翻译时:在对应片段文件补 key;如需新片段则在此 import + 合并。
import commonNo from '@/locales/no/common.json';
import projectsNo from '@/locales/no/projects.json';
import workflowNo from '@/locales/no/workflow.json';
import masterdataANo from '@/locales/no/masterdataA.json';
import masterdataBNo from '@/locales/no/masterdataB.json';
import teamNo from '@/locales/no/team.json';
import projectChecklistNo from '@/locales/no/project-checklist.json';
import projectPartiesNo from '@/locales/no/project-parties.json';
import projectDocsNo from '@/locales/no/project-docs.json';
import projectOverviewNo from '@/locales/no/project-overview.json';

import commonEn from '@/locales/en/common.json';
import projectsEn from '@/locales/en/projects.json';
import workflowEn from '@/locales/en/workflow.json';
import masterdataAEn from '@/locales/en/masterdataA.json';
import masterdataBEn from '@/locales/en/masterdataB.json';
import teamEn from '@/locales/en/team.json';
import projectChecklistEn from '@/locales/en/project-checklist.json';
import projectPartiesEn from '@/locales/en/project-parties.json';
import projectDocsEn from '@/locales/en/project-docs.json';
import projectOverviewEn from '@/locales/en/project-overview.json';

export const STORAGE_KEY = 'nks_lang';

const no = {
  ...commonNo,
  ...projectsNo,
  ...workflowNo,
  ...masterdataANo,
  ...masterdataBNo,
  ...teamNo,
  ...projectChecklistNo,
  ...projectPartiesNo,
  ...projectDocsNo,
  ...projectOverviewNo,
};

const en = {
  ...commonEn,
  ...projectsEn,
  ...workflowEn,
  ...masterdataAEn,
  ...masterdataBEn,
  ...teamEn,
  ...projectChecklistEn,
  ...projectPartiesEn,
  ...projectDocsEn,
  ...projectOverviewEn,
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        no: { translation: no },
        en: { translation: en },
      },
      lng: 'no',
      fallbackLng: 'no',
      supportedLngs: ['no', 'en'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage'],
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
      },
      react: { useSuspense: false },
    });
}

export default i18n;
