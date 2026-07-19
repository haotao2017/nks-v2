/**
 * 从预览模板 URL 拉取 PDF 作为 multipart 附件（对齐旧 admin fetch(attachmentURL)）。
 */
export async function fetchUrlAsFile(
  url: string,
  filename = 'attachment.pdf',
): Promise<File | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type || 'application/pdf';
    return new File([blob], filename, { type });
  } catch {
    return null;
  }
}
