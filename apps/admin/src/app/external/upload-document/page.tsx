'use client';

/**
 * 外部参与方 —— 上传文档(免登录,靠 URL 里的 UrlKey 鉴权)。
 *
 * 流程:
 *  1) 从 URL 读 WorkflowId/ProjectID/PartyID/PartyTypeID/UrlKey(大小写不敏感)。
 *  2) GetDocumentsListRequiredFromParty → 需上传的文档类型清单。
 *  3) GetProjectSinglePartyDocsUploadedFileList / GetDocumentsListCountUploadByParty → 已上传情况。
 *  4) 每个文档类型可选文件并 UploadDocumentFromParty(multipart)上传。
 */

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  useRequiredDocs,
  useUploadDocs,
  useUploadedCount,
  useUploadedFiles,
} from '../_lib/api';
import { InvalidLinkCard, LoadErrorCard, LoadingCard } from '../_lib/feedback';
import { isValidBaseParams, parsePartyParams, type PartyParams } from '../_lib/params';

export default function UploadDocumentPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <UploadDocumentContent />
    </Suspense>
  );
}

function UploadDocumentContent() {
  const { t } = useTranslation();
  const sp = useSearchParams();
  const params = useMemo(() => parsePartyParams(sp), [sp]);
  const valid = isValidBaseParams(params);

  const required = useRequiredDocs(params, valid);
  const uploaded = useUploadedFiles(params, valid);
  const count = useUploadedCount(params, valid);

  if (!valid) return <InvalidLinkCard />;

  if (required.isLoading || uploaded.isLoading) {
    return <LoadingCard label={t('external.upload.loading')} />;
  }
  if (required.isError) {
    return <LoadErrorCard onRetry={() => required.refetch()} />;
  }

  const docs = required.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('external.upload.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('external.upload.subtitle')}</p>
      </div>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {t('external.upload.noDocs')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <DocTypeRow
              key={doc.docTypeId}
              params={params}
              docTypeId={doc.docTypeId ?? 0}
              docName={doc.docName ?? t('external.upload.defaultDocName')}
              isRequired={doc.isRequired ?? false}
              uploadedFileNames={(uploaded.data ?? [])
                .filter((f) => f.partyDocTypeId === doc.docTypeId)
                .map((f) => f.fileName ?? '')
                .filter(Boolean)}
              uploadedCount={
                count.data?.documentsCountByDocType?.find(
                  (c) => c.docTypeID === doc.docTypeId,
                )?.uploadedFilesCount
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocTypeRow({
  params,
  docTypeId,
  docName,
  isRequired,
  uploadedFileNames,
  uploadedCount,
}: {
  params: PartyParams;
  docTypeId: number;
  docName: string;
  isRequired: boolean;
  uploadedFileNames: string[];
  uploadedCount?: number;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<File[]>([]);
  const upload = useUploadDocs(params);

  const count = uploadedCount ?? uploadedFileNames.length;

  function onPick(list: FileList | null) {
    if (!list) return;
    setSelected((prev) => [...prev, ...Array.from(list)]);
  }

  function removeAt(i: number) {
    setSelected((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    if (selected.length === 0) return;
    upload.mutate(
      { docTypeId, files: selected },
      {
        onSuccess: () => {
          toast.success(t('external.upload.uploadSuccess', { name: docName }));
          setSelected([]);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : t('external.upload.uploadError')),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-4" aria-hidden />
            <CardTitle className="text-base">{docName}</CardTitle>
            {isRequired ? (
              <Badge variant="destructive">{t('external.upload.required')}</Badge>
            ) : null}
          </div>
          {count > 0 ? (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <CheckCircle2 className="size-3.5 text-green-600" aria-hidden />
              {t('external.upload.uploadedCount', { count })}
            </span>
          ) : null}
        </div>
        {uploadedFileNames.length > 0 ? (
          <CardDescription className="mt-1 space-y-0.5">
            {uploadedFileNames.map((name, i) => (
              <span key={`${name}-${i}`} className="block truncate">
                {name}
              </span>
            ))}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="border-input hover:bg-accent/50 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors">
          <Upload className="size-4" aria-hidden />
          <span>{t('external.upload.chooseFiles')}</span>
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              onPick(e.target.files);
              e.target.value = '';
            }}
          />
        </label>

        {selected.length > 0 ? (
          <ul className="space-y-1">
            {selected.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="bg-muted/50 flex items-center justify-between gap-2 rounded px-2 py-1 text-sm"
              >
                <span className="truncate">
                  {f.name}{' '}
                  <span className="text-muted-foreground">
                    ({formatBytes(f.size)})
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={t('external.upload.removeFile', { name: f.name })}
                  onClick={() => removeAt(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={submit}
            disabled={selected.length === 0 || upload.isPending}
          >
            {upload.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t('external.upload.uploading')}
              </>
            ) : (
              t('external.upload.uploadButton')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
