'use client';

/**
 * 外部参与方 —— 更新偏差 / 上传检查项图片(免登录,靠 URL 里的 UrlKey 鉴权)。
 *
 * 流程:
 *  1) 从 URL 读 WorkflowId/ProjectID/PartyID/PartyTypeID/UrlKey/CKII(大小写不敏感)。
 *  2) GetChecklistItemInspectinDataForParty(带 CKII 逗号分隔的检查项 ID)
 *     → 展示这些检查项的检验数据/偏差(状态/备注/已有图片)。
 *  3) 每个检查项可选图片并 UploadChecklistItemImageInspectinDataFromParty(multipart)上传,
 *     后端按 checklistItemIdCommaSeperated 关联图片并标记 isImageUploadedByParty。
 */

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ClipboardCheck,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectChecklistItemsInspDataDto } from '@nks/api-types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useInspectionData, useUploadInspectionImages } from '../_lib/api';
import { InvalidLinkCard, LoadErrorCard, LoadingCard } from '../_lib/feedback';
import { isValidDeviationParams, parsePartyParams, type PartyParams } from '../_lib/params';

export default function UpdateDeviationPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <UpdateDeviationContent />
    </Suspense>
  );
}

function UpdateDeviationContent() {
  const sp = useSearchParams();
  const params = useMemo(() => parsePartyParams(sp), [sp]);
  const valid = isValidDeviationParams(params);

  const inspection = useInspectionData(params, valid);

  if (!valid) return <InvalidLinkCard />;

  if (inspection.isLoading) {
    return <LoadingCard label="Laster avvik …" />;
  }
  if (inspection.isError) {
    return <LoadErrorCard onRetry={() => inspection.refetch()} />;
  }

  const data = inspection.data;
  const items = data?.projectChecklistItemsInspData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Oppdater avvik</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Last opp bilder som dokumenterer utbedring av avvikene under. Du kan
          laste opp flere bilder per punkt.
        </p>
        {data?.checklistName ? (
          <p className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-sm">
            <ClipboardCheck className="size-4" aria-hidden />
            {data.checklistName}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Ingen avvik å vise.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ChecklistItemRow key={item.id} params={params} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistItemRow({
  params,
  item,
}: {
  params: PartyParams;
  item: ProjectChecklistItemsInspDataDto;
}) {
  const [selected, setSelected] = useState<File[]>([]);
  const upload = useUploadInspectionImages(params);

  const checklistItemId = item.id ?? 0;
  const images = item.projectChecklistItemImageInspData ?? [];

  function onPick(list: FileList | null) {
    if (!list) return;
    setSelected((prev) => [...prev, ...Array.from(list)]);
  }

  function removeAt(i: number) {
    setSelected((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    if (selected.length === 0 || !checklistItemId) return;
    upload.mutate(
      { checklistItemId, files: selected },
      {
        onSuccess: () => {
          toast.success('Bilder lastet opp');
          setSelected([]);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Opplasting feilet'),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            {item.title ?? 'Kontrollpunkt'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {item.wasDev ? <Badge variant="destructive">Avvik</Badge> : null}
            {item.status ? <Badge variant="secondary">{item.status}</Badge> : null}
            {item.isImageUploadedByParty ? (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <CheckCircle2 className="size-3.5 text-green-600" aria-hidden />
                Bilder mottatt
              </span>
            ) : null}
          </div>
        </div>
        {item.comment ? (
          <CardDescription className="mt-1">{item.comment}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {images.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 inline-flex items-center gap-1.5 text-xs">
              <ImageIcon className="size-3.5" aria-hidden />
              Opplastede bilder
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img) =>
                img.imageURL ? (
                  <a
                    key={img.id ?? img.imageName}
                    href={img.imageURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-input block overflow-hidden rounded-md border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageURL}
                      alt={img.imageName ?? 'Bilde'}
                      loading="lazy"
                      className="aspect-square h-full w-full object-cover"
                    />
                  </a>
                ) : null,
              )}
            </div>
          </div>
        ) : null}

        <label className="border-input hover:bg-accent/50 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors">
          <Upload className="size-4" aria-hidden />
          <span>Velg bilder</span>
          <input
            type="file"
            accept="image/*"
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
                  aria-label={`Fjern ${f.name}`}
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
                Laster opp …
              </>
            ) : (
              'Last opp bilder'
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
