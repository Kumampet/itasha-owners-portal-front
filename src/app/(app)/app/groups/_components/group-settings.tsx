"use client";

import { Button } from "@/components/button";

interface GroupSettingsProps {
  isLeader: boolean;
  isMember: boolean;
  processing: boolean;
  onDisbandClick: () => void;
  onTransferClick: () => void;
  onLeaveClick: () => void;
}

export function GroupSettings({
  isLeader,
  isMember,
  processing,
  onDisbandClick,
  onTransferClick,
  onLeaveClick,
}: GroupSettingsProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base mb-4">
          設定
        </h2>
        <div className="flex flex-col gap-2">
          {isLeader ? (
            <>
              <Button
                variant="danger"
                size="lg"
                rounded="md"
                onClick={onDisbandClick}
                disabled={processing}
                className="whitespace-nowrap"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                解散する
              </Button>
              <Button
                variant="secondary"
                size="lg"
                rounded="md"
                onClick={onTransferClick}
                disabled={processing}
                className="whitespace-nowrap"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
                オーナー権限譲渡
              </Button>
            </>
          ) : isMember ? (
            <Button
              variant="secondary"
              size="lg"
              rounded="md"
              onClick={onLeaveClick}
              disabled={processing}
              className="whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              団体を抜ける
            </Button>
          ) : (
            <p className="text-xs text-zinc-500">
              設定可能な項目がありません。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
