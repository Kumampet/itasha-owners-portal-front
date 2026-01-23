"use client";

import Link from "next/link";
import { Button } from "@/components/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { LabeledTextInput } from "@/components/labeled-text-input";

type Event = {
  id: string;
  name: string;
  theme: string | null;
  event_date: string;
};

interface GroupTargetEventCardProps {
  eventLoading: boolean;
  selectedEvent: Event | null;
}

// 対象イベントカード
function GroupTargetEventCard({
  eventLoading,
  selectedEvent,
}: GroupTargetEventCardProps) {
  if (eventLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!selectedEvent) {
    return null;
  }

  return (
    <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">
        対象イベント
      </p>
      <p className="text-base font-bold text-zinc-900">
        {selectedEvent.name}
      </p>
      {selectedEvent.theme && (
        <p className="mt-1 text-sm text-zinc-700">{selectedEvent.theme}</p>
      )}
      <p className="mt-2 text-xs text-zinc-600">
        {new Date(selectedEvent.event_date).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <p className="mt-3 text-xs text-zinc-600 border-t border-emerald-200 pt-3">
        このイベントに関連する団体を作成します
      </p>
    </div>
  );
}

interface NewGroupCreateFormProps {
  error: string;
  eventLoading: boolean;
  selectedEvent: Event | null;
  formData: {
    name: string;
    theme: string;
    maxMembers: string;
  };
  onFormDataChange: (data: {
    name: string;
    theme: string;
    maxMembers: string;
  }) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function NewGroupCreateForm({
  error,
  eventLoading,
  selectedEvent,
  formData,
  onFormDataChange,
  saving,
  onSubmit,
}: NewGroupCreateFormProps) {
  return (
    <>
      <GroupTargetEventCard
        eventLoading={eventLoading}
        selectedEvent={selectedEvent}
      />
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
      >
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <LabeledTextInput
          label="団体名"
          type="text"
          value={formData.name}
          onChange={(e) =>
            onFormDataChange({ ...formData, name: e.target.value })
          }
          required
          placeholder="例: レトロスポーツ痛車会"
        />

        <LabeledTextInput
          label="テーマ"
          type="text"
          value={formData.theme}
          onChange={(e) =>
            onFormDataChange({ ...formData, theme: e.target.value })
          }
          placeholder="例: 80年代スポーツカー中心"
        />

        <LabeledTextInput
          label="最大メンバー数"
          type="number"
          value={formData.maxMembers}
          onChange={(e) =>
            onFormDataChange({ ...formData, maxMembers: e.target.value })
          }
          min="1"
          placeholder="例: 10"
          helpText="指定しない場合は制限なし"
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            rounded="md"
            className="flex-1"
            disabled={saving}
          >
            {saving ? "作成中..." : "作成する"}
          </Button>
          <Link
            href="/app/groups"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 whitespace-nowrap"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </>
  );
}
