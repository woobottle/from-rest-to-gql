import { useEffect, useState } from "react";
import { getViewerId, setViewerId } from "../viewer";

type AuthUser = { id: string; name: string; avatarUrl: string; role: string };

// 학습 단순화를 위한 viewer 선택기. 상단 우측에 항상 떠 있어요.
// 실제 로그인 흐름은 이 과제의 학습 대상이 아니에요.
export function ViewerPicker() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const current = getViewerId();

  useEffect(() => {
    fetch("http://localhost:4100/auth/users")
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>viewer</span>
      <select
        value={current}
        onChange={(e) => setViewerId(e.target.value)}
        style={{ padding: "4px 8px" }}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
      </select>
    </div>
  );
}
