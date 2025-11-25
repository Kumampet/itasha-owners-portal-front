"use client";

import { useState, useEffect, useCallback } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string; // "USER" | "ADMIN" | "ORGANIZER"
  is_banned: boolean;
  created_at: string;
};

type SortBy = "created_at" | "email" | "role";
type SortOrder = "asc" | "desc";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (filterRole !== "ALL") {
        params.append("role", filterRole);
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, searchQuery, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");
      await fetchUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("権限の更新に失敗しました");
    }
  };

  const handleToggleOrganizer = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "ORGANIZER" ? "USER" : "ORGANIZER";
      const res = await fetch(`/api/admin/users/${userId}/organizer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_organizer: newRole === "ORGANIZER" }),
      });

      if (!res.ok) throw new Error("Failed to update organizer status");
      await fetchUsers();
    } catch (error) {
      console.error("Failed to update organizer status:", error);
      alert("主催者権限の更新に失敗しました");
    }
  };

  const handleToggleBan = async (userId: string, currentValue: boolean) => {
    if (!confirm(currentValue ? "BANを解除しますか？" : "このユーザーをBANしますか？")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: !currentValue }),
      });

      if (!res.ok) throw new Error("Failed to update ban status");
      await fetchUsers();
    } catch (error) {
      console.error("Failed to update ban status:", error);
      alert("BAN状態の更新に失敗しました");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          ユーザー管理
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          ユーザー一覧、権限管理、BAN管理を行います
        </p>
      </div>

      {/* フィルター・ソート・検索 */}
      <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 検索 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="メールアドレスまたは名前で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* ロールフィルター */}
          <div className="flex gap-2">
            {(["ALL", "USER", "ADMIN", "ORGANIZER"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  filterRole === role
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {role === "ALL" ? "すべて" : role === "USER" ? "ユーザー" : role === "ADMIN" ? "管理者" : "主催者"}
              </button>
            ))}
          </div>
        </div>

        {/* ソート */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-700">並び替え:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="created_at">登録日</option>
              <option value="email">メールアドレス</option>
              <option value="role">権限</option>
            </select>
            <button
              onClick={() =>
                setSortOrder(sortOrder === "asc" ? "desc" : "asc")
              }
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">ユーザーがありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  メールアドレス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  名前
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  権限
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  主催者
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  BAN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  登録日
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {user.name || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleUpdateRole(user.id, e.target.value)
                      }
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      <option value="USER">ユーザー</option>
                      <option value="ADMIN">管理者</option>
                      <option value="ORGANIZER">主催者</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      onClick={() =>
                        handleToggleOrganizer(user.id, user.role)
                      }
                      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                        user.role === "ORGANIZER"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {user.role === "ORGANIZER" ? "有効" : "無効"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      onClick={() => handleToggleBan(user.id, user.is_banned)}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                        user.is_banned
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {user.is_banned ? "BAN中" : "正常"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      onClick={() =>
                        handleToggleBan(user.id, user.is_banned)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      {user.is_banned ? "BAN解除" : "BAN"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

