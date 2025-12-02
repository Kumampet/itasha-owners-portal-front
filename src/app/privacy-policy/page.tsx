import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
            ← トップページに戻る
          </Link>
        </div>
        
        <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">
            痛車オーナーズナビ（いたなび！）プライバシーポリシー
          </h1>
          
          <p className="mb-6 text-zinc-700 leading-relaxed">
            痛車オーナーズナビ（以下「本サービス」といいます）の運営者（以下「運営者」といいます）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            1. 収集する情報および収集方法
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            運営者は、本サービスの提供にあたり、主に以下の情報（個人情報を含む）を収集します。
          </p>
          
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border-collapse border border-zinc-300">
              <thead>
                <tr className="bg-zinc-100">
                  <th className="border border-zinc-300 px-4 py-3 text-left font-semibold text-zinc-900">収集する情報</th>
                  <th className="border border-zinc-300 px-4 py-3 text-left font-semibold text-zinc-900">収集方法</th>
                  <th className="border border-zinc-300 px-4 py-3 text-left font-semibold text-zinc-900">利用目的</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">認証情報</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">XまたはGoogleアカウント連携</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">ユーザー登録、ログイン、本人確認のため。</td>
                </tr>
                <tr className="bg-zinc-50">
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">プロフィール情報</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">連携先から取得/ユーザーの入力</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">XユーザーID、Googleアカウント名、表示名、プロフィール画像URL。サービス内での識別・公開のため。</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">メールアドレス</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">連携先から取得/ユーザーの入力</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">連絡、サービスに関する通知（締切リマインダー等）、オーガナイザー情報の公開のため。</td>
                </tr>
                <tr className="bg-zinc-50">
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">団体・イベント情報</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">ユーザーの入力</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">「併せ」管理、イベント情報の公開・共有のため。</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">アクセス情報</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">Cookie、Google Analytics</td>
                  <td className="border border-zinc-300 px-4 py-3 text-zinc-700">サイト利用状況の分析、サービス改善、広告効果測定のため。</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            2. 個人情報の利用目的
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            収集した個人情報の主な利用目的は以下の通りです。
          </p>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li className="text-zinc-700">本サービス（イベント情報の一元管理、団体管理等）の提供・運営のため。</li>
            <li className="text-zinc-700">ユーザーの本人確認、認証、アカウント管理のため。</li>
            <li className="text-zinc-700">本サービスに関する重要な通知（締切リマインダー、規約変更等）を行うため。</li>
            <li className="text-zinc-700">本サービスの改善、新機能の開発、および統計データの作成のため。</li>
            <li className="text-zinc-700">広告配信および広告効果の測定のため（第4項に詳述）。</li>
          </ol>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            3. 個人情報の第三者提供
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            運営者は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
          </p>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li className="text-zinc-700">法令に基づく場合。</li>
            <li className="text-zinc-700">人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき。</li>
            <li className="text-zinc-700">公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき。</li>
            <li className="text-zinc-700">国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき。</li>
          </ol>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            4. 広告の配信について（外部サービスの利用）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            本サービスでは、広告配信事業者としてGoogle AdSenseを利用しています。Google AdSenseは、ユーザーの興味に応じた広告を表示するためにCookieを使用します。
          </p>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            Cookieにより収集される情報には、氏名、住所、電話番号、メールアドレスなどの特定の個人を識別する情報は含まれません。
          </p>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            ユーザーは、ご自身のブラウザ設定を変更することにより、Cookieの利用を停止することができます。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            5. 個人情報の開示、訂正、利用停止等
          </h2>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            ユーザーは、運営者に対し、自己の個人情報の開示、訂正、追加、削除、または利用の停止を求めることができます。これらの請求があった場合、運営者は本人確認を行った上で、法令に基づき適切に対応いたします。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            6. お問い合わせ窓口
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            本ポリシーに関するご質問や、個人情報の取り扱いに関するお問い合わせは、下記の連絡先までお願いいたします。
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">運営者</strong>：痛車オーナーズナビ（個人）
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">連絡先メールアドレス</strong>：itashaownersnavi@gmail.com
            </li>
          </ul>

          <hr className="my-8 border-zinc-200" />
          
          <p className="text-zinc-700">
            <strong className="font-semibold text-zinc-900">制定日</strong>：2025年12月2日
          </p>
        </div>
        
        <div className="mt-6 text-center">
          <Link
            href="/app/auth"
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
            ログインページに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}

