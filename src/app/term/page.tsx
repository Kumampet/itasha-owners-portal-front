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
          <p className="mb-4 text-zinc-700 leading-relaxed">
            ユーザーは、本規約に同意しない限り、本サービスを利用できません。本サービスの利用を開始した時点で、ユーザーは本規約の全条項（第4条に定める運営者による団体メッセージの閲覧に関する事項を含みます）に同意したものとみなされます。
          </p>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            現時点において、本サービスの基本的な利用に際し、ユーザーから運営者に対する利用料金の支払義務は発生しません。運営者が将来、有償の役務を提供する場合には、その提供条件および料金は、当該役務に関して別途定めるとおりとします。
          </p>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            運営者が本サービス上で別途定めるガイドライン、ルール、注意事項などは、本規約の一部を構成するものとします。
          </p>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第2条（定義）
          </h2>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「本サービス」</strong>：運営者が提供する痛車イベント情報の一元管理、団体管理を主目的とする「痛車オーナーズナビ（いたなび！）」という名称のサービス（ウェブサイトおよび関連するアプリケーションを含みます）。本サービスは、電気通信番号（いわゆる電話番号）を用いた電気通信役務の提供を行うものではありません。
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「ユーザー」</strong>：本規約に同意し、X（旧Twitter）アカウントまたはGoogleアカウントを用いて本サービスにログインした個人をいいます。
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「団体」</strong>：「併せ」など、ユーザー間で形成されるグループ管理機能を通じて作成されたコミュニティをいいます。
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">「オーガナイザー」</strong>：運営者の承認を経てオーガナイザー権限（イベント主催者としての登録等）が付与されたユーザーであって、当該権限に基づき本サービス上でイベント情報を登録・公開し、又は団体を管理する者をいいます。
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-zinc-900 mt-8 mb-4">
            第3条（ログイン・アカウント）
          </h2>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            本サービスの利用を希望する者は、本規約（第4条に定める運営者による団体メッセージの閲覧を含みます）に同意した上で、運営者の定める方法によりX（旧Twitter）アカウントまたはGoogleアカウントを用いてログインし、本サービスを利用します。一般のユーザーについて、運営者による個別の承認手続を経ることなく、当該ログインが完了した時点から本アプリケーションを利用できます。
          </p>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            イベント主催者として本サービス上で一定の機能（イベント情報の登録・公開等）を利用するための<strong className="font-semibold text-zinc-900">オーガナイザー権限</strong>を付与されたいユーザーは、運営者の定める手続により申請を行い、運営者の承認があった場合に限り、当該権限に基づく機能を利用できます。
          </p>
          <p className="mb-6 text-zinc-700 leading-relaxed">
            ユーザーが過去に本規約に違反した場合、その他運営者が不適切と判断した場合は、運営者は当該ユーザーの本サービスの利用の拒否、ログインの制限、アカウントの停止又は削除その他必要な措置を講じることができます。
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
          <p className="mb-4 text-zinc-700 leading-relaxed">
            ユーザーは、本サービスに登録した時点において表示名を別途設定していない場合であっても、前項のとおりGoogleアカウント名もしくはXのユーザー名が団体メンバーに表示されることに同意したものとみなします。
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
            団体機能を通じてユーザーが作成・入力した情報（参加者リスト、チャット内容等）は、当該団体の作成者および団体に属する全メンバーが閲覧・共有可能とします。
          </p>

          <h3 className="text-xl font-semibold text-zinc-800 mt-6 mb-3">
            運営者による団体メッセージの閲覧（モデレーション）
          </h3>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            団体メッセージ（グループチャット）機能において、運営者は、違法・有害情報への対応、利用規約違反の確認、サービス上の紛争・安全上の調査、その他本サービスを安全かつ適正に運営するために必要な範囲で、<strong className="font-semibold text-zinc-900">必要最小限の権限を付与された運営者側の管理者（いたなび！管理者）のみ</strong>が、当該団体のやり取りの内容を閲覧・確認できる場合があります。当該閲覧は、一般利用者向けに公開される機能ではなく、モデレーションおよび法令遵守のためのものに限られます。
          </p>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            運営者は、上記の目的の範囲を超えて当該情報を利用し、又は第三者に開示しないよう努めます（法令に基づく開示・提供、裁判所・行政機関の命令、権利侵害の調査その他正当な理由がある場合を除きます）。
          </p>
          <p className="mb-4 text-zinc-700 leading-relaxed">
            ユーザーは、本サービスの利用を開始した時点で、本条に定める運営者による閲覧・確認に同意したものとみなします。
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
              <strong className="font-semibold text-zinc-900">運営者</strong>：痛車オーナーズナビ（個人）
            </li>
            <li className="text-zinc-700">
              <strong className="font-semibold text-zinc-900">連絡先メールアドレス</strong>：itashaownersnavi@gmail.com
            </li>
          </ul>

          <hr className="my-8 border-zinc-200" />
          
          <p className="mb-2 text-zinc-700">
            <strong className="font-semibold text-zinc-900">制定日</strong>：2025年12月2日
          </p>
          <p className="text-zinc-700">
            <strong className="font-semibold text-zinc-900">最終改定日</strong>：2026年4月7日
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
