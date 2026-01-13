"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { UserActionMenu } from "@/components/user-action-menu";
import { UserBanModal } from "@/components/user-ban-modal";
import { UserRoleModal } from "@/components/user-role-modal";
import { UserDisplayNameModal } from "@/components/user-display-name-modal";
import { UserDeleteModal } from "@/components/user-delete-modal";
import { UserPermanentDeleteModal } from "@/components/user-permanent-delete-modal";
import { UserRestoreModal } from "@/components/user-restore-modal";

type User = {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  role: string; // "USER" | "ADMIN" | "ORGANIZER"
  is_banned: boolean;
  deleted_at: string | null;
  created_at: string;
};

type SortBy = "created_at" | "email" | "role";
type SortOrder = "asc" | "desc";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  // モーダル状態
  const [banModalUser, setBanModalUser] = useState<User | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [displayNameModalUser, setDisplayNameModalUser] = useState<User | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [restoreModalUser, setRestoreModalUser] = useState<User | null>(null);
  const [permanentDeleteModalUser, setPermanentDeleteModalUser] = useState<User | null>(null);

  useEffect(() => {
    document.title = "いたなび管理画面 | ユーザー管理";
  }, []);

  // organizerはアクセス不可
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;
    if (session.user?.role !== "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch users: ${res.status}`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert(error instanceof Error ? error.message : "ユーザーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, searchQuery, filterRole]);

  useEffect(() => {
    // adminのみアクセス可能
    if (status === "loading" || !session || session.user?.role !== "ADMIN") {
      return;
    }
    fetchUsers();
  }, [fetchUsers, session, status]);

  const handleBan = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: !user.is_banned }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update ban status");
      }
      await fetchUsers();
      setBanModalUser(null);
    } catch (error) {
      console.error("Failed to update ban status:", error);
      alert(error instanceof Error ? error.message : "BAN状態の更新に失敗しました");
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }
      await fetchUsers();
      setRoleModalUser(null);
    } catch (error) {
      console.error("Failed to update role:", error);
      alert(error instanceof Error ? error.message : "権限の更新に失敗しました");
    }
  };

  const handleDisplayNameChange = async (user: User, displayName: string | null) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/display-name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update display name");
      }
      await fetchUsers();
      setDisplayNameModalUser(null);
    } catch (error) {
      console.error("Failed to update display name:", error);
      alert(error instanceof Error ? error.message : "表示名の更新に失敗しました");
    }
  };

  const handleDelete = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      await fetchUsers();
      setDeleteModalUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(error instanceof Error ? error.message : "ユーザーの削除に失敗しました");
    }
  };

  const handleRestore = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/restore`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to restore user");
      }
      await fetchUsers();
      setRestoreModalUser(null);
    } catch (error) {
      console.error("Failed to restore user:", error);
      alert(error instanceof Error ? error.message : "ユーザーの復帰に失敗しました");
    }
  };

  const handlePermanentDelete = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/permanent-delete`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to permanently delete user");
      }
      await fetchUsers();
      setPermanentDeleteModalUser(null);
    } catch (error) {
      console.error("Failed to permanently delete user:", error);
      alert(error instanceof Error ? error.message : "ユーザーの完全削除に失敗しました");
    }
  };

  const getStatusText = (user: User): string => {
    if (user.deleted_at) return "削除済";
    if (user.is_banned) return "BAN";
    return "有効";
  };

  const getStatusColor = (user: User): string => {
    if (user.deleted_at) return "text-zinc-500";
    if (user.is_banned) return "text-red-600";
    return "text-green-600";
  };

  const getRoleText = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "管理者";
      case "ORGANIZER":
        return "主催者";
      default:
        return "ユーザー";
    }
  };

  const getUserDisplayName = (user: User): string => {
    return user.name || user.email.split("@")[0] || "ユーザー";
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
              <Button
                key={role}
                variant={filterRole === role ? "primary" : "secondary"}
                size="sm"
                rounded="md"
                onClick={() => setFilterRole(role)}
                className={filterRole === role ? "" : "bg-zinc-100 hover:bg-zinc-200"}
              >
                {role === "ALL" ? "すべて" : role === "USER" ? "ユーザー" : role === "ADMIN" ? "管理者" : "主催者"}
              </Button>
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
            <Button
              variant="secondary"
              size="sm"
              rounded="md"
              onClick={() =>
                setSortOrder(sortOrder === "asc" ? "desc" : "asc")
              }
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
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
                  ユーザー名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  表示名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-700">
                  権限
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
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {user.display_name || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={getStatusColor(user)}>
                      {getStatusText(user)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                    {getRoleText(user.role)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <UserActionMenu
                      userId={user.id}
                      isBanned={user.is_banned}
                      isDeleted={!!user.deleted_at}
                      onBanClick={() => setBanModalUser(user)}
                      onRoleChangeClick={() => setRoleModalUser(user)}
                      onDisplayNameChangeClick={() => setDisplayNameModalUser(user)}
                      onDeleteClick={() => setDeleteModalUser(user)}
                      onRestoreClick={() => setRestoreModalUser(user)}
                      onPermanentDeleteClick={() => setPermanentDeleteModalUser(user)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* モーダル */}
      {banModalUser && (
        <UserBanModal
          isOpen={!!banModalUser}
          onClose={() => setBanModalUser(null)}
          onConfirm={() => handleBan(banModalUser)}
          isBanned={banModalUser.is_banned}
          userName={getUserDisplayName(banModalUser)}
        />
      )}

      {roleModalUser && (
        <UserRoleModal
          key={roleModalUser.id}
          isOpen={!!roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onConfirm={(role) => handleRoleChange(roleModalUser, role)}
          currentRole={roleModalUser.role}
          userName={getUserDisplayName(roleModalUser)}
        />
      )}

      {displayNameModalUser && (
        <UserDisplayNameModal
          key={displayNameModalUser.id}
          isOpen={!!displayNameModalUser}
          onClose={() => setDisplayNameModalUser(null)}
          onConfirm={(displayName) => handleDisplayNameChange(displayNameModalUser, displayName)}
          currentDisplayName={displayNameModalUser.display_name}
          userName={getUserDisplayName(displayNameModalUser)}
        />
      )}

      {deleteModalUser && (
        <UserDeleteModal
          isOpen={!!deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          onConfirm={() => handleDelete(deleteModalUser)}
          email={deleteModalUser.email}
          name={deleteModalUser.name}
          displayName={deleteModalUser.display_name}
        />
      )}

      {restoreModalUser && (
        <UserRestoreModal
          isOpen={!!restoreModalUser}
          onClose={() => setRestoreModalUser(null)}
          onConfirm={() => handleRestore(restoreModalUser)}
          userName={getUserDisplayName(restoreModalUser)}
        />
      )}

      {permanentDeleteModalUser && (
        <UserPermanentDeleteModal
          isOpen={!!permanentDeleteModalUser}
          onClose={() => setPermanentDeleteModalUser(null)}
          onConfirm={() => handlePermanentDelete(permanentDeleteModalUser)}
          email={permanentDeleteModalUser.email}
          name={permanentDeleteModalUser.name}
          displayName={permanentDeleteModalUser.display_name}
        />
      )}
    </div>
  );
}
