/**
 * 在线状态判定（@react-native-community/netinfo）。
 * 工地弱网命脉:写操作先落本地,联网时才推送;恢复联网触发补传。
 */
import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

function stateIsOnline(s: NetInfoState): boolean {
  // isInternetReachable 可能为 null(未知),此时以 isConnected 为准
  return Boolean(s.isConnected) && s.isInternetReachable !== false;
}

/** 响应式在线状态(供 UI 显示离线横幅等)。 */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOnline(stateIsOnline(s)));
    void NetInfo.fetch().then((s) => setOnline(stateIsOnline(s)));
    return () => unsub();
  }, []);
  return online;
}

/** 一次性查询当前是否在线(推送前判定)。 */
export async function isOnlineNow(): Promise<boolean> {
  const s = await NetInfo.fetch();
  return stateIsOnline(s);
}

/** 订阅「恢复联网」事件(用于触发补传);返回取消订阅函数。 */
export function subscribeToOnline(cb: () => void): () => void {
  let wasOnline = true;
  return NetInfo.addEventListener((s) => {
    const online = stateIsOnline(s);
    if (online && !wasOnline) cb();
    wasOnline = online;
  });
}
