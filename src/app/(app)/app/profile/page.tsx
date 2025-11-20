import Link from "next/link";

export default function ProfilePage() {
    return (
        <main className="flex-1">
            <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
                <header>
                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        マイページ
                    </h1>
                    <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                        自分専用のリマインダー一覧やフォロー中イベント、公開プロフィール設定を
                        行う画面です。
                    </p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            基本情報
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            認証基盤（Cognito）連携後、ここにメールアドレスやプロフィールURLなどの
                            情報を表示し、編集できるようにします。
                        </p>
                    </section>

                    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            公開プロフィール
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            SNS的なフォロー/いいね機能は搭載せず、
                            参加予定・参加済みイベントや参加中の団体のみを
                            穏やかに共有できるページとして設計します。
                        </p>
                    </section>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/app/profile/reminders"
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                    >
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            リマインダー管理
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            気になるイベントやエントリー済みイベントの
                            締切・集合時間・支払期日をまとめて確認。
                        </p>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </Link>

                    <Link
                        href="/app/profile/groups"
                        className="rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-900 sm:p-5"
                    >
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            団体（併せ）管理
                        </h2>
                        <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
                            併せメンバーの募集状況や一斉連絡ポリシーを確認し、
                            マイページからまとめて運用できます。
                        </p>
                        <p className="mt-3 text-xs font-semibold text-emerald-600">
                            詳細を見る →
                        </p>
                    </Link>
                </div>
            </section>
        </main>
    );
}
