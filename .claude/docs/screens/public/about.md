# サービス概要

- **URL**: `/about`
- **実装**: `src/app/about/page.tsx`, `src/content/service-overview.ts`
- **認証**: 不要

## 内容

静的コピー中心。段落コンポーネント `about-detail-paragraph.tsx` で表示。

## SEO

公開ページとして index 対象（`/app` 配下とは異なる）。

## 変更時

文言は `service-overview.ts` を更新し、デザインは既存 about ページのトーンに合わせる。
