import Link from "next/link";

export default function TermPage() {
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
            痛車オーナーズナビ（いたなび！）利用規約
          </h1>
          
          <p className="mb-6 text-zinc-700 leading-relaxed">
            本利用規約（以下「本規約」といいます）は、痛車オーナーズナビ（以下「本サービス」といいます）の提供条件および本サービスの利用に関する、本サービス運営者（以下「運営者」といいます）と登録ユーザー様（以下「ユーザー」といいます）との間の権利義務関係を定めるものです。本サービスをご利用になる前に、本規約の全文をお読みください。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第1条（適用）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            本規約は、本サービスの利用に関する運営者とユーザーとの一切の関係に適用されます。
          </p>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            運営者が本サービス上で別途定めるガイドライン、ルール、注意事項などは、本規約の一部を構成するものとします。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第2条（定義）
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「本サービス」</strong>：運営者が提供する痛車イベント情報の一元管理、団体（併せ）管理を主目的とする「痛車オーナーズナビ（いたなび！）」という名称のサービス（ウェブサイトおよび関連するアプリケーションを含みます）。
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「ユーザー」</strong>：本規約に同意し、本サービスを利用するためにアカウント登録を行った個人をいいます。
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「団体」</strong>：「併せ」など、ユーザー間で形成されるグループ管理機能を通じて作成されたコミュニティをいいます。
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「オーガナイザー」</strong>：本サービスにイベント情報を登録・公開し、または団体を管理するユーザーをいいます。
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第3条（アカウント登録）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            本サービスの利用を希望する者は、本規約に同意した上で、運営者の定める方法によりアカウント登録を申請し、運営者の承認をもって登録が完了します。
          </p>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            登録申請者が過去に本規約に違反した者である場合、その他運営者が不適切と判断した場合は、運営者は登録を拒否することができます。
          </p>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            登録にあたり、ユーザーはX（旧Twitter）アカウントまたはGoogleアカウントを利用します。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第4条（ユーザー情報の公開と利用）
          </h2>
          
          <h3 className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
            表示名の公開
          </h3>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            ユーザーが団体機能を利用する際、団体チャットやメンバー一覧においては、ユーザーが設定した表示名、または設定がない場合はGoogleアカウント名もしくはXのユーザー名が表示され、団体メンバー全員に公開されます。
          </p>

          <h3 className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
            メールアドレスの公開
          </h3>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            ユーザーの登録メールアドレスは、原則として他の一般ユーザーに対しては非公開とします。ただし、イベントのオーガナイザーとして登録した場合、そのメールアドレスはイベント詳細画面などで公開されます。
          </p>

          <h3 className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
            団体情報の共有
          </h3>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            団体機能を通じてユーザーが作成・入力した情報（参加者リスト、チャット内容等）は、当該団体の管理者および団体に属する全メンバーが閲覧・共有可能とします。
          </p>

          <h3 className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
            利用目的
          </h3>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            運営者は、ユーザー情報を本サービスの提供、維持、改善、および利用状況の分析のために利用します。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第5条（団体管理機能の利用）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            ユーザーは、団体機能を利用する際、その団体の目的および本規約を遵守するものとします。
          </p>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            団体内でのトラブルや紛争については、原則として当事者間で解決するものとし、運営者は一切の責任を負いません。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第6条（広告の表示と収益）
          </h2>
          
          <h3 className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
            広告の表示
          </h3>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            運営者は、本サービスにGoogle AdSenseを含む第三者の広告を掲載することができ、ユーザーはこれに同意します。
          </p>

          <h3 className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
            収益の目的
          </h3>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            本サービスの運営は非営利目的ですが、広告収入は、サーバー費用、ドメイン費用などの運営費用の一部を賄うために充当されます。ユーザーは、広告表示を通じて発生する収益が運営者に帰属することに同意します。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第7条（禁止事項）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
          </p>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li className="text-zinc-700">法令または公序良俗に違反する行為。</li>
            <li className="text-zinc-700">犯罪行為に関連する行為。</li>
            <li className="text-zinc-700">他のユーザーまたは第三者の著作権、商標権、その他の権利を侵害する行為。</li>
            <li className="text-zinc-700">他のユーザーまたは第三者を誹謗中傷、差別、または名誉毀損する行為。</li>
            <li className="text-zinc-700">本サービスを通じて取得した情報を、本サービスの利用目的以外で利用する行為。</li>
            <li className="text-zinc-700">本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為。</li>
            <li className="text-zinc-700">不正アクセス、またはこれを試みる行為。</li>
            <li className="text-zinc-700">虚偽の情報によりアカウントを登録し、またはイベント情報を公開する行為。</li>
            <li className="text-zinc-700">その他、運営者が不適切と判断する行為。</li>
          </ol>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第8条（本サービスの停止等）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができます。
          </p>
          <ol className="list-decimal list-inside space-y-2 mb-6">
            <li className="text-zinc-700">本サービスに係るコンピューターシステムの点検または保守作業を行う場合。</li>
            <li className="text-zinc-700">コンピューター、通信回線等が事故により停止した場合。</li>
            <li className="text-zinc-700">地震、落雷、火災、風水害、停電、天災地変などの不可抗力により本サービスの運営ができなくなった場合。</li>
            <li className="text-zinc-700">その他、運営者が停止または中断を必要と判断した場合。</li>
          </ol>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第9条（免責事項）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            運営者は、本サービスに掲載されている情報（イベント情報、主催者情報、広告情報等を含む）の正確性、完全性、有用性について、いかなる保証もするものではありません。ユーザーは、自己の責任において利用するものとします。
          </p>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            本サービスを通じて発生したユーザー間のトラブル、またはユーザーと第三者との間のトラブルについて、運営者は一切の責任を負いません。
          </p>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            本サービスの提供の中断、停止、終了、利用不能、または情報の消失によってユーザーに生じた損害について、運営者は一切の責任を負いません。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第10条（規約の変更）
          </h2>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができます。本規約の変更後、ユーザーが本サービスを利用し続けることにより、当該変更後の規約に同意したものとみなします。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第11条（連絡窓口）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            本サービスに関するお問い合わせや連絡は、以下に示す連絡先を通じて行うものとします。
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">運営者</strong>：痛車オーナーズナビ
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
