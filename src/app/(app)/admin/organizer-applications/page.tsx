"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";

type Application = {
  id: string;
  display_name: string;
  email: string;
  experience: string;
  status: string;
  admin_note: string | null;
  applicant: {
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
};

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type SortBy = "created_at" | "display_name" | "email";
type SortOrder = "asc" | "desc";

export default function AdminOrganizerApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("PENDING");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    document.title = "いたなび管理画面 | オーガナイザー申請一覧";
  }, []);

  // organizerはアクセス不可
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;
    if (session.user?.role !== "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  const fetchApplications = useCallback(async (skipCache = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") {
        params.append("status", filterStatus);
      }
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (skipCache) {
        params.append("_t", Date.now().toString()); // キャッシュ回避用のタイムスタンプ
      }

      const res = await fetch(`/api/admin/organizer-applications?${params.toString()}`, {
        cache: skipCache ? "no-store" : "default",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ 
          error: "Unknown error",
          details: `HTTP ${res.status}: ${res.statusText}`
        }));
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || `Failed to fetch applications: ${res.status}`;
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    // adminのみアクセス可能
    if (status === "loading" || !session || session.user?.role !== "ADMIN") {
      return;
    }
    fetchApplications();
  }, [fetchApplications, session, status]);

  const handleApprove = async (applicationId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/organizer-applications/${applicationId}/approve`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to approve application");
      // 承認後はキャッシュを無効化して最新情報を取得
      await fetchApplications(true);
      setSelectedApplication(null);
      setShowApproveModal(false);
    } catch (error) {
      console.error("Failed to approve application:", error);
      alert("承認に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (applicationId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/organizer-applications/${applicationId}/reject`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to reject application");
      // 却下後はキャッシュを無効化して最新情報を取得
      await fetchApplications(true);
      setSelectedApplication(null);
      setShowRejectModal(false);
    } catch (error) {
      console.error("Failed to reject application:", error);
      alert("却下に失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "未処理";
      case "APPROVED":
        return "承認済み";
      case "REJECTED":
        return "却下";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "未定";
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          オーガナイザー申請一覧
        </h1>
        <p className="mt-2 text-sm text-zinc-600 sm:text-base">
          ユーザーからのオーガナイザー登録申請を確認・処理します
        </p>
      </div>

      {/* フィルター・ソート・検索 */}
      <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 検索 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="表示名、メールアドレス、運営実績で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          {/* ステータスフィルター */}
          <div className="flex gap-2">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "primary" : "secondary"}
                  size="sm"
                  rounded="md"
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? "" : "bg-zinc-100 hover:bg-zinc-200"}
                >
                  {status === "ALL"
                    ? "すべて"
                    : status === "PENDING"
                    ? "未処理"
                    : status === "APPROVED"
                    ? "承認済み"
                    : "却下"}
                </Button>
              )
            )}
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
              <option value="created_at">申請日</option>
              <option value="display_name">表示名</option>
              <option value="email">メールアドレス</option>
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

      {/* 申請一覧 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">オーガナイザー申請がありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <div
              key={application.id}
              className={`rounded-lg border p-4 transition ${
                application.status === "APPROVED" || application.status === "REJECTED"
                  ? "border-zinc-200 bg-zinc-50 opacity-60"
                  : "border-zinc-200 bg-white hover:border-zinc-900 hover:shadow-md"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className={`flex-1 ${application.status === "APPROVED" || application.status === "REJECTED" ? "text-zinc-400" : ""}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        application.status
                      )}`}
                    >
                      {getStatusLabel(application.status)}
                    </span>
                    <span className={`text-xs ${application.status === "APPROVED" || application.status === "REJECTED" ? "text-zinc-400" : "text-zinc-500"}`}>
                      {application.applicant?.email || application.email}
                    </span>
                  </div>
                  <h3 className={`text-base font-semibold ${application.status === "APPROVED" || application.status === "REJECTED" ? "text-zinc-400" : "text-zinc-900"}`}>
                    {application.display_name}
                  </h3>
                  <p className={`mt-1 text-sm line-clamp-2 ${application.status === "APPROVED" || application.status === "REJECTED" ? "text-zinc-400" : "text-zinc-600"}`}>
                    {application.experience}
                  </p>
                  <div className={`mt-2 flex flex-wrap gap-4 text-xs ${application.status === "APPROVED" || application.status === "REJECTED" ? "text-zinc-400" : "text-zinc-500"}`}>
                    <span>申請日: {formatDate(application.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    rounded="md"
                    onClick={() => setSelectedApplication(application)}
                    disabled={application.status === "APPROVED" || application.status === "REJECTED"}
                  >
                    詳細
                  </Button>
                  {application.status === "PENDING" && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        rounded="md"
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowApproveModal(true);
                        }}
                        disabled={processing}
                      >
                        承認
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        rounded="md"
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowRejectModal(true);
                        }}
                        disabled={processing}
                      >
                        却下
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">オーガナイザー申請の詳細</h2>
              <Button
                variant="secondary"
                size="sm"
                rounded="md"
                onClick={() => {
                  setSelectedApplication(null);
                  setShowApproveModal(false);
                  setShowRejectModal(false);
                }}
                className="text-zinc-600 hover:text-zinc-900 border-0 bg-transparent p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-700">表示名</h3>
                <p className="mt-1 text-sm text-zinc-900">{selectedApplication.display_name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">メールアドレス</h3>
                <p className="mt-1 text-sm text-zinc-600">{selectedApplication.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">歴代の運営実績</h3>
                <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                  {selectedApplication.experience}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">申請者</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {selectedApplication.applicant?.email || "未ログイン"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700">申請日</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatDate(selectedApplication.created_at)}
                </p>
              </div>

              {selectedApplication.status === "PENDING" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="success"
                    size="md"
                    rounded="md"
                    fullWidth
                    onClick={() => {
                      setShowApproveModal(true);
                    }}
                  >
                    承認
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    rounded="md"
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    disabled={processing}
                  >
                    却下
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 承認確認モーダル */}
      {showApproveModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">承認確認</h2>
            <p className="mb-6 text-sm text-zinc-700">
              この申請を承認しますか？承認すると、申請者にオーガナイザー権限が付与されます。
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                rounded="md"
                onClick={() => {
                  setShowApproveModal(false);
                }}
                disabled={processing}
              >
                キャンセル
              </Button>
              <Button
                variant="success"
                size="md"
                rounded="md"
                onClick={() => handleApprove(selectedApplication.id)}
                disabled={processing}
              >
                {processing ? "処理中..." : "承認する"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 却下確認モーダル */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">却下確認</h2>
            <p className="mb-6 text-sm text-zinc-700">
              この申請を却下しますか？却下すると、申請者に通知が送信されます。
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                rounded="md"
                onClick={() => {
                  setShowRejectModal(false);
                }}
                disabled={processing}
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                size="md"
                rounded="md"
                onClick={() => handleReject(selectedApplication.id)}
                disabled={processing}
              >
                {processing ? "処理中..." : "却下する"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

