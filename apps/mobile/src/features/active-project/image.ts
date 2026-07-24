/**
 * 图片 → FormData 部件 工具(移植自 kontrollApp/app/util 的 uriToFormDataCompatible)。
 *
 * 简化点:expo-image-picker 拍照/选图恒返回本地 URI(file:// / content:// / ph://),
 * 故用 expo-image-manipulator 一步完成「缩放到 1920 宽 + HEIC→JPEG + 压缩 0.8」,
 * 产出稳定的本地 JPEG file:// URI,直接 append 成 RN 的 multipart 文件部件
 * {uri,type,name}。已上传的远程 http(s) 图不重传(见 isLocalImageUri)。
 */
import * as ImageManipulator from 'expo-image-manipulator';

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

/** 压缩后的图片部件:Blob + 文件名。 */
export interface FormBlobPart {
  blob: Blob;
  name: string;
}

/**
 * 本地图 URI 归一化为压缩后的 JPEG，并读成真正的 Blob。
 *
 * Expo SDK 54+ 的全局 fetch 是 WinterCG 实现,其 FormData 只接受 string / Blob,
 * 不再支持 React Native 传统的 {uri,name,type} 文件部件(会抛
 * "Unsupported FormDataPart implementation")。故这里先用 ImageManipulator 产出
 * 稳定的本地 JPEG,再 fetch(file://) 读成 Blob(iOS URLSession 支持 file scheme),
 * 交给调用方以 form.append(field, blob, name) 追加。
 */
export async function uriToFormDataPart(
  uri: string,
  namePrefix = 'image',
): Promise<FormBlobPart> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 },
  );
  const response = await fetch(result.uri);
  const blob = await response.blob();
  return {
    blob,
    name: `${namePrefix}-${Date.now()}.jpeg`,
  };
}
