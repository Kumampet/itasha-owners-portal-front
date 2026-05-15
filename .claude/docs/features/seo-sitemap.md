# SEO とサイトマップ

## メタデータ

- `src/lib/metadata.ts`, `robots-metadata.ts`
- `/app` は noindex（layout の meta 操作）
- `NEXT_PUBLIC_PREVENT_INDEXING` 等でステージング制御

## サイトマップ

- `sitemap.xml`, `sitemap-fixed.xml`, `api/events-sitemap.xml`
- イベント URL の S3 同期: `scripts/sync-events-sitemap.ts`

## 破壊禁止

- 未承認イベント URL のサイトマップ掲載
- 固定ページサイトマップから `/privacy` 等の必須 URL を消す
