/**
 * 图片 → FormData 部件 工具(移植自 kontrollApp/app/util 的 uriToFormDataCompatible)。
 *
 * 简化点:expo-image-picker 拍照/选图恒返回本地 URI(file:// / content:// / ph://),
 * 故用 expo-image-manipulator 一步完成「缩放到 1920 宽 + HEIC→JPEG + 压缩 0.8」,
 * 产出稳定的本地 JPEG file:// URI,直接 append 成 RN 的 multipart 文件部件
 * {uri,type,name}。已上传的远程 http(s) 图不重传(见 isLocalImageUri)。
 */
import * as ImageManipulator from 'expo-image-manipulator';

export interface FormFilePart {
  uri: string;
  type: string;
  name: string;
}

/** 是否为「本地待上传」图(排除已上传的远程 https)。 */
export function isLocalImageUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    uri.startsWith('data:')
  );
}

/** 本地图 URI 归一化为压缩后的 JPEG 文件部件。 */
export async function uriToFormDataPart(
  uri: string,
  namePrefix = 'image',
): Promise<FormFilePart> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 },
  );
  return {
    uri: result.uri,
    type: 'image/jpeg',
    name: `${namePrefix}-${Date.now()}.jpeg`,
  };
}
