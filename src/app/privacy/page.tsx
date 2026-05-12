import Link from "next/link";
import { PublicSiteFooter } from "@/components/public-site-footer";

export default function PrivacyPage() {
  return (
    <>
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            ← トップページに戻る
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            痛車オーナーズナビ（いたなび！）プライバシーポリシー
          </h1>

          <p className="mb-6 leading-relaxed text-muted-foreground">
            痛車オーナーズナビ（いたなび！）（以下「本サービス」といいます）を運営する Kumampet（以下「運営者」といいます）は、ユーザーの個人情報の取扱いについて、個人情報の保護に関する法律、その他関連法令並びにガイドラインに従い、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            1. 収集する情報および収集方法
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            運営者は、本サービスの提供にあたり、次の情報（個人情報を含みます）を取得する場合があります。取得しない情報については載せません。
          </p>

          <div className="mb-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-border">
              <thead>
                <tr className="bg-card-elevated">
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    収集する情報の例
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    主な収集方法
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    主な利用目的
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    認証に関する識別子（OAuth が付与するトークン、連携先のアカウントに紐づく ID など）
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    X アカウントまたは Google アカウントでのログイン（OAuth）
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    ユーザー登録、ログイン、本人確認、アカウント不正利用の防止のため。
                  </td>
                </tr>
                <tr className="bg-card-elevated">
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    プロフィール情報（表示名、ユーザー名またはハンドル、プロフィール画像の URL 等）
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    認証サービスからの提供、ユーザーによるサービス内の入力・変更
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    サービス内での識別・表示、その他サービス機能のため。
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    メールアドレス
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    Google アカウント情報から取得、またはユーザー入力
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    締切リマインダー等の通知、お問い合わせへの返信、本人確認、その他サービス運営上必要な連絡のため。オーガナイザーに関わる運営上の情報として公開する場合がある旨はサービス画面上の説明および
                    <Link
                      href="/term"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      利用規約
                    </Link>
                    に従います。
                  </td>
                </tr>
                <tr className="bg-card-elevated">
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    イベント・団体（併せ）に関する情報、メッセージの内容、その他サービス利用に伴う入力内容
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    ユーザーによる入力送信
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    イベント情報・団体管理・通知・共有など、当該機能の提供および不正利用調査・モデレーションのため（運営者が内容を確認する場合の範囲は
                    <Link
                      href="/term"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      利用規約
                    </Link>
                    で定めるとおりです）。
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    アクセスログ、Cookie・ローカルストレージ等に保存される一意の識別子、ブラウザ・OS・端末の種類、参照元・遷移先 URL、ページ閲覧日時などの利用・通信情報
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    本サービスの利用時に自動的に送信・記録される情報、Cookie を通じて取得する情報（Google アナリティクスおよび広告関連のサービスによる取得を含みます）。
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    サイトの稼働・セキュリティ維持、利用状況の分析によるサービス改善、広告の配信および効果の測定のため。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            ユーザーは、本サービスの機能に応じ、上記以外の入力を任意に行うことがあります。その情報は入力の趣旨どおりサービス運営のためにのみ利用されます。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            2. 個人情報の利用目的
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            収集した情報の利用目的は、第 1 条の各項および次のとおりです。
          </p>
          <ol className="mb-6 list-inside list-decimal space-y-2">
            <li className="text-muted-foreground">
              イベント情報や団体（併せ）機能を含む本サービスの提供・連絡・サポート・改善のため。
            </li>
            <li className="text-muted-foreground">
              ユーザー認証、アカウント管理及びログイン状態の維持のため。
            </li>
            <li className="text-muted-foreground">
              締切リマインダー等に関する重要な通知および規約・ポリシー変更などの連絡のため。
            </li>
            <li className="text-muted-foreground">
              統計処理に基づく匿名又は統計情報の報告およびマーケティング分析（個人を特定できない形式にしたうえでの利用を含む）のため。
            </li>
            <li className="text-muted-foreground">
              違法または本ポリシー・利用規約に抵触する利用の調査・防止および利用者並びに第三者の安全の確保のため。
            </li>
          </ol>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            3. 個人情報の第三者への提供（開示）
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            運営者は、次のいずれかに該当する場合を除き、あらかじめユーザーの同意を得ずに第三者に個人情報を開示または提供いたしません。
          </p>
          <ol className="mb-6 list-inside list-decimal space-y-2">
            <li className="text-muted-foreground">法令に基づく場合。</li>
            <li className="text-muted-foreground">
              人の生命、身体または財産の保護のために必要であり、同意を得ることが困難である場合。
            </li>
            <li className="text-muted-foreground">
              公衆衛生の向上または児童の健全な育成の推進に特に必要であり、同意を得ることが困難である場合。
            </li>
            <li className="text-muted-foreground">
              国の機関、地方公共団体またはその委託を受けた者が法令の定める事務を遂行する際に協力する必要がある場合で、同意を得ることにより当該事務の遂行に支障を及ぼすおそれがある場合。
            </li>
          </ol>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            4. 業務の委託、国外での処理
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            運営者は、サービス開発・インフラ（ホスティング等）、メール送信、認証サービス、アクセス解析、広告の配信・測定等の業務の一部について、適切な委託先に個人データの取扱いを委託することがあります。その場合には、運営者が選定した委託先に対し監督を行うとともに、必要な契約を締結します。
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            委託先にサービス提供者が設置する情報処理システムは、クラウド上にあり、収集されるデータがサーバが所在する国・地域および利用に伴い米国などの国外で保存または処理される場合があります。運営者は、適用法令に沿った契約および措置により保護されるよう留意します。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            5. Cookie・広告・解析ツールについて
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            本サービスでは、利用状況の把握やコンテンツの最適化、広告配信およびその効果測定のため、第三者（例：Google LLC）による Cookie、その他広告または解析に係る類似の技術の利用があります。これらにより、広告やページ閲覧の履歴などに関連する情報が取得され、広告ネットワーク上でユーザーに関心と推測されるカテゴリに基づく広告（パーソナライズド広告等）が表示されることがあります。氏名や住所などのような特定の項目が常に自動で渡るわけではありませんが、識別子・利用ログに基づくオンライン上の広告配信および測定目的でデータが処理される場合があります。
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Google AdSense 等における広告に関しては、
            <a
              href="https://policies.google.com/technologies/ads"
              className="underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google の広告に関するポリシー
            </a>
            （英語サイトを含みます）、および必要性に応じ
            <a
              href="https://business.safety.google/privacy/"
              className="underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google のサービス共通の説明
            </a>
            をご確認ください。
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            ユーザーはブラウザの設定で Cookie を無効化できます。広告パーソナライゼーションのオプトアウトについては、
            <a
              href="https://adssettings.google.com/"
              className="underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google の広告設定
            </a>
            にて調整することができます。この設定または Cookie の辞退は、機能の一部に制約が生じたり広告が非パーソナライズとなる場合がありますが、サービスへのログイン等主要機能が常にすべて利用できなくなるものではありません。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            6. 安全管理・保存期間
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            運営者は、個人情報の漏えい・滅失・毀損の防止ならびに是正のために、適切かつ合理的な安全管理措置（アクセス制御、権限管理、環境に応じた技術的措施等）を講じます。
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            個人情報の保存期間は、収集時の利用目的達成または法令上の義務がある期間が経過した後、削除または匿名化の措置が可能な状態で不要データを順次処理する方針とします。アカウント削除等の請求がある場合には、運営上および法令上の必要性を確認のうえ、合理的な範囲で速やかに対応します。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            7. ユーザーからの開示・訂正・利用停止等の請求
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            ユーザーご本人または代理人から、運営者が保有する自己の個人情報の開示、訂正、追加・削除、利用停止、または第三者への提供の停止につき請求がある場合には、本条の問い合わせ窓口に連絡ください。運営者は、ご本人確認（代理人のときは適法な権限の確認も含む）を行ったうえで、法令に沿って合理的な期間内に対応します。法令により開示しないことが許される場合があります。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            8. 未成年の利用について
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            本サービスの利用により個人情報の提供が行われる場合、お住まいの地域における適用法令において親権者等の同意が必要となる年齢に満たない方は、その同意を得たうえでご利用ください。運営者が未成年のユーザーから同意なしで故意に収集することが判明した場合には、適切な措置を講ずるように努めます。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            9. 本ポリシーの変更
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            運営者は法令の変更、サービス内容の変更その他やむを得ない事由により本ポリシーを変更することがあります。変更後の内容は本サービス上に掲示し、または法令上必要な場合は別途適切な方法で周知します。重要な変更の場合は、その旨および効力発生時期が分かるよう明示します。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            10. 地域・アクセス環境による利用制限について
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            運営者は、データ保護法制の適用や運用上の健全性への配慮から、ホスティング事業者等がリクエストに付与することがある送信元ごとの国または地域の推定コードなどに基づき、自動的に接続元を判定し、欧州経済領域（EEA）、英国および運営者が本条に準じて対象とする関連法域からのアクセスに対して、本サービスの提供を行わず接続自体をお断りする場合があります。
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            当該判定は推定に依拠します。VPN、モバイル回線やクラウドプロキシ経由、転居や旅行、その他ネットワークの構成により実際と異なる国コードが付されることがあり、その結果サービス全体または一部へアクセスいただけなかったりエラーとなる場合があります。
          </p>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            本条に基づくブロックのみを目的として、個人情報を継続的に保有しマーケティング向けに利用するものではありません。対象地域および判定方法は運用変更に伴い改めることがあります。ご質問は末尾のお問い合わせ窓口へご連絡ください。
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">
            11. お問い合わせ窓口
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            本ポリシーの内容および個人情報の取扱いに関するご質問、開示請求等は、下記よりご連絡ください。
          </p>
          <ul className="mb-6 list-inside list-disc space-y-2">
            <li className="text-muted-foreground">
              <span className="font-semibold text-foreground">運営者</span>
              ：Kumampet
            </li>
            <li className="text-muted-foreground">
              <span className="font-semibold text-foreground">X（旧 Twitter）</span>
              ：
              <a
                href="https://x.com/Kumampet_main"
                className="ml-1 underline underline-offset-2 hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                @Kumampet_main
              </a>
            </li>
            <li className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                メールアドレス
              </span>
              ：itashaownersnavi@gmail.com
              <span className="text-sm text-muted-foreground">
                （題名または本文に「プライバシーに関するお問い合わせ」の旨ご記載ください）
              </span>
            </li>
          </ul>

          <hr className="my-8 border-border" />

          <p className="mb-2 text-muted-foreground">
            <strong className="font-semibold text-foreground">制定日</strong>：2025年12月2日
          </p>
          <p className="text-muted-foreground">
            <strong className="font-semibold text-foreground">
              最終改定日
            </strong>
            ：2026年5月12日
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/app/auth"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            ログインページに戻る
          </Link>
        </div>
      </div>
    </main>
    <PublicSiteFooter />
    </>
  );
}
