"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminDashboard() {
  const { data: session } = useSession();

  useEffect(() => {
    document.title = "いたなび管理画面 | ダッシュボード";
  }, []);

  const menuItems = [
    {
      title: "イベント管理",
      description: "イベントの承認、作成、編集、削除",
      href: "/admin/events",
      icon: "📅",
    },
    {
      title: "新規イベントを作成",
      description: "新しいイベントを作成",
      href: "/admin/events/new",
      icon: "➕",
    },
  ];

  // adminのみ表示するメニュー項目
  const adminOnlyMenuItems = [
    {
      title: "ユーザー管理",
      description: "ユーザー一覧、権限管理、BAN管理",
      href: "/admin/users",
      icon: "👥",
    },
    {
      title: "イベント掲載依頼フォーム",
      description: "ユーザーからのイベント掲載依頼を確認・処理",
      href: "/admin/submissions",
      icon: "📝",
    },
    {
      title: "お問い合わせ管理",
      description: "ユーザーからのお問い合わせを確認・処理",
      href: "/admin/contacts",
      icon: "💬",
    },
    {
      title: "団体モデレーション",
      description: "すべての団体のチャット内容と参加ユーザーを管理",
      href: "/admin/groups",
      icon: "👥",
    },
    {
      title: "オーガナイザー申請一覧",
      description: "ユーザーからのオーガナイザー登録申請を確認・処理",
      href: "/admin/organizer-applications",
      icon: "📋",
    },
  ];

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          オーガナイザー機能 ダッシュボード
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          管理者: {session?.user?.email}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-border bg-card p-6 transition hover:border-accent-mint/50 hover:shadow-md"
          >
            <div className="mb-4 text-3xl">{item.icon}</div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </Link>
        ))}
        {/* adminのみ表示するメニュー項目 */}
        {session?.user?.role === "ADMIN" &&
          adminOnlyMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-lg border border-border bg-card p-6 transition hover:border-accent-mint/50 hover:shadow-md"
            >
              <div className="mb-4 text-3xl">{item.icon}</div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}

