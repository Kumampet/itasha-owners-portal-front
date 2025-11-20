export default function AppHomePage() {
    return (
        <main className="flex-1">
            <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
                <header>
                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                        今日とこれからの予定
                    </h1>
                    <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                        参加予定イベントのエントリー開始・締切・支払い期限、併せの集合時間などを
                        1つのタイムラインで確認できます。
                    </p>
                </header>

                <div className="space-y-4">
                    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            本日のリマインダー
                        </h2>
                        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                            まだデータは登録されていません。イベントをフォローすると、ここに
                            エントリー開始・締切・集合時間などが表示されます。
                        </p>
                    </section>

                    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                            近日中のイベント
                        </h2>
                        <ul className="mt-2 space-y-2 text-xs text-zinc-700 sm:text-sm">
                            <li>・イベントを登録すると、ここに3件まで表示されます。</li>
                            <li>・エントリー開始前にはプッシュ通知とメールでお知らせします。</li>
                            <li>・支払期限前には、併せのメンバーにも共有できるようにします。</li>
                        </ul>
                    </section>
                </div>
            </section>
        </main>
    );
}


