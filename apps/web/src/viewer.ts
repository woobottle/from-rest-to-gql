// 학습 단순화를 위해 "로그인된 viewer"는 localStorage 한 칸으로 표현해요.
// 상단의 ViewerPicker로 바꿔 끼울 수 있고, lib/api.ts의 fetch 헬퍼가
// 자동으로 X-Viewer-Id 헤더에 실어 보내요.

const STORAGE_KEY = "viewerId";
const DEFAULT_VIEWER_ID = "u1"; // 시현 — 시작 viewer

export function getViewerId(): string {
  if (typeof window === "undefined") return DEFAULT_VIEWER_ID;
  return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_VIEWER_ID;
}

export function setViewerId(id: string): void {
  window.localStorage.setItem(STORAGE_KEY, id);
  // 변경을 다른 컴포넌트에 알리기 위해 새로고침
  window.location.reload();
}
