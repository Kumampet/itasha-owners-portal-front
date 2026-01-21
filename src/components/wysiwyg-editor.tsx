"use client";

import { useEffect, useRef, useState } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  ContentState,
  CompositeDecorator,
  convertFromHTML,
  SelectionState,
  ContentBlock,
} from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import "draft-js/dist/Draft.css";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

// リンク用のデコレータストラテジー
const findLinkEntities = (
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
  contentState: ContentState
) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    if (entityKey !== null) {
      const entity = contentState.getEntity(entityKey);
      return entity.getType() === "LINK";
    }
    return false;
  }, callback);
};

// リンク用のコンポーネント
const LinkComponent = (props: {
  contentState: ContentState;
  entityKey: string;
  children: React.ReactNode;
}) => {
  const { contentState, entityKey, children } = props;
  const entity = contentState.getEntity(entityKey);
  const data = entity.getData();
  const url = data.url || data.href || '';
  const target = data.target || '_blank';

  return (
    <a
      href={url}
      target={target}
      rel="nofollow noreferrer"
      style={{
        color: "#2563eb",
        textDecoration: "underline",
        cursor: "pointer",
      }}
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      {children}
    </a>
  );
};

/**
 * WYSIWYGエディタコンポーネント（Draft.js使用）
 * 最小限の実装
 */
export function WysiwygEditor({
  value,
  onChange,
  placeholder = "テキストを入力してください...",
  disabled = false,
  onKeyDown,
}: WysiwygEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: LinkComponent,
      },
    ]);
    return EditorState.createEmpty(decorator);
  });
  const editorRef = useRef<Editor>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkTarget, setLinkTarget] = useState<"_self" | "_blank">("_blank");
  const lastOutputHtmlRef = useRef<string>("");

  // EditorStateをHTMLに変換
  const convertEditorStateToHtml = (editorState: EditorState): string => {
    const html = stateToHTML(editorState.getCurrentContent(), {
      inlineStyles: {
        BOLD: { element: "strong" },
        ITALIC: { element: "em" },
        UNDERLINE: { element: "u" },
        STRIKETHROUGH: { element: "s" },
      },
      entityStyleFn: (entity) => {
        const entityType = entity.getType();
        if (entityType === "LINK") {
          const data = entity.getData();
          return {
            element: "a",
            attributes: {
              href: data.url || data.href,
              target: data.target || "_blank",
              rel: "nofollow noreferrer",
            },
          };
        }
        return {};
      },
    });

    // デフォルトの<p>タグを<div>タグに置き換え（属性も保持）
    return html.replace(/<p\s*([^>]*)>/g, '<div$1>').replace(/<\/p>/g, '</div>');
  };

  // HTMLからEditorStateに変換
  useEffect(() => {
    if (value === lastOutputHtmlRef.current) {
      return;
    }

    if (!value) {
      const decorator = new CompositeDecorator([
        {
          strategy: findLinkEntities,
          component: LinkComponent,
        },
      ]);
      setEditorState(EditorState.createEmpty(decorator));
      lastOutputHtmlRef.current = "";
      return;
    }

    try {
      const blocksFromHTML = convertFromHTML(value);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );

      const decorator = new CompositeDecorator([
        {
          strategy: findLinkEntities,
          component: LinkComponent,
        },
      ]);
      const newEditorState = EditorState.createWithContent(contentState, decorator);
      setEditorState(newEditorState);
      lastOutputHtmlRef.current = value;
    } catch (error) {
      console.error("Error converting HTML to EditorState:", error);
    }
  }, [value]);

  // EditorStateの変更をHTMLに変換して親に通知
  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const html = convertEditorStateToHtml(newEditorState);
    lastOutputHtmlRef.current = html;
    onChange(html);
  };

  // リンクを追加する処理
  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      return;
    }

    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    if (selection.isCollapsed()) {
      const textToInsert = linkTitle.trim() || linkUrl;
      const entityKey = contentState.createEntity("LINK", "MUTABLE", {
        url: linkUrl.trim(),
        target: linkTarget,
      }).getLastCreatedEntityKey();

      const newContentState = Modifier.insertText(
        contentState,
        selection,
        textToInsert,
        undefined,
        entityKey
      );

      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "insert-characters"
      );

      const newSelection = selection.merge({
        anchorOffset: selection.getStartOffset() + textToInsert.length,
        focusOffset: selection.getStartOffset() + textToInsert.length,
      });

      handleChange(EditorState.forceSelection(newEditorState, newSelection));
    } else {
      const entityKey = contentState.createEntity("LINK", "MUTABLE", {
        url: linkUrl.trim(),
        target: linkTarget,
      }).getLastCreatedEntityKey();

      const newContentState = Modifier.applyEntity(
        contentState,
        selection,
        entityKey
      );

      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "apply-entity"
      );

      handleChange(newEditorState);
    }

    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkTitle("");
    setLinkTarget("_blank");
  };

  // インラインスタイルの適用
  const toggleInlineStyle = (inlineStyle: string) => {
    const newEditorState = RichUtils.toggleInlineStyle(editorState, inlineStyle);
    handleChange(newEditorState);
  };

  // 現在のインラインスタイルを取得
  const getCurrentInlineStyle = () => {
    return editorState.getCurrentInlineStyle();
  };

  return (
    <div className="wysiwyg-editor-wrapper">
      <style jsx global>{`
        .wysiwyg-editor-wrapper {
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: white;
        }
        .wysiwyg-editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          padding: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .wysiwyg-editor-toolbar button {
          padding: 0.375rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .wysiwyg-editor-toolbar button:hover:not(:disabled) {
          background: #f3f4f6;
        }
        .wysiwyg-editor-toolbar button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .wysiwyg-editor-toolbar button.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .wysiwyg-editor-content {
          padding: 1rem;
          min-height: 200px;
          font-size: 0.875rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Roboto", "Helvetica Neue", Arial, sans-serif;
        }
        .wysiwyg-editor-content .DraftEditor-root {
          min-height: 200px;
        }
        .wysiwyg-editor-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .wysiwyg-editor-content a:hover {
          color: #1d4ed8;
        }
      `}</style>

      {/* ツールバー */}
      <div className="wysiwyg-editor-toolbar">
        {/* 太字 */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleInlineStyle("BOLD");
          }}
          disabled={disabled}
          className={getCurrentInlineStyle().has("BOLD") ? "active" : ""}
          title="太字"
        >
          <strong>B</strong>
        </button>

        {/* 斜体 */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleInlineStyle("ITALIC");
          }}
          disabled={disabled}
          className={getCurrentInlineStyle().has("ITALIC") ? "active" : ""}
          title="斜体"
        >
          <em>I</em>
        </button>

        {/* 下線 */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleInlineStyle("UNDERLINE");
          }}
          disabled={disabled}
          className={getCurrentInlineStyle().has("UNDERLINE") ? "active" : ""}
          title="下線"
        >
          <u>U</u>
        </button>

        {/* 取り消し線 */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleInlineStyle("STRIKETHROUGH");
          }}
          disabled={disabled}
          className={
            getCurrentInlineStyle().has("STRIKETHROUGH") ? "active" : ""
          }
          title="取り消し線"
        >
          <s>S</s>
        </button>

        {/* リンク */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowLinkDialog(true);
            const selection = editorState.getSelection();
            if (!selection.isCollapsed()) {
              const contentState = editorState.getCurrentContent();
              const selectedText = contentState.getPlainText().slice(
                selection.getStartOffset(),
                selection.getEndOffset()
              );
              setLinkTitle(selectedText);
            } else {
              setLinkTitle("");
            }
            setLinkUrl("");
            setLinkTarget("_blank");
          }}
          disabled={disabled}
          title="リンク"
        >
          🔗
        </button>
      </div>

      {/* リンク追加ダイアログ */}
      {showLinkDialog && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setShowLinkDialog(false)}
          />
          <div className="fixed z-[101] bg-white border border-zinc-300 rounded-lg shadow-lg p-4 min-w-[320px] max-w-[90vw] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900">リンクを追加</h3>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="text-red-500 hover:text-red-700 text-xl leading-none"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {/* URL入力 */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="http://"
                  className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && linkUrl.trim()) {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                />
              </div>

              {/* タイトル入力 */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="リンクテキスト"
                  className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && linkUrl.trim()) {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                />
              </div>

              {/* ウィンドウ選択 */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  ウィンドウ
                </label>
                <select
                  value={linkTarget}
                  onChange={(e) => setLinkTarget(e.target.value as "_self" | "_blank")}
                  className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="_blank">新しいウィンドウで開く</option>
                  <option value="_self">同じウィンドウで開く</option>
                </select>
              </div>

              {/* 追加ボタン */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-900 text-white hover:bg-zinc-800 disabled:hover:bg-zinc-900"
                >
                  リンクを追加
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* エディタ */}
      <div
        className="wysiwyg-editor-content"
        onKeyDown={onKeyDown}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={disabled}
          customStyleMap={{
            BOLD: { fontWeight: 'bold' },
            ITALIC: { fontStyle: 'italic' },
            UNDERLINE: { textDecoration: 'underline' },
            STRIKETHROUGH: { textDecoration: 'line-through' },
          }}
        />
      </div>
    </div>
  );
}
