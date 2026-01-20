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
} from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import "draft-js/dist/Draft.css";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// 文字サイズのスタイルマップ
const sizeStyleMap: Record<string, React.CSSProperties> = {
  極小: { fontSize: "0.625rem" },
  小: { fontSize: "0.75rem" },
  中: { fontSize: "0.875rem" },
  大: { fontSize: "1.125rem" },
  特大: { fontSize: "1.5rem" },
};

// 文字色リスト（12色）
const colors = [
  { label: "黒", value: "#000000" },
  { label: "白", value: "#FFFFFF" },
  { label: "赤", value: "#FF0000" },
  { label: "青", value: "#0000FF" },
  { label: "緑", value: "#008000" },
  { label: "黄", value: "#FFFF00" },
  { label: "オレンジ", value: "#FFA500" },
  { label: "紫", value: "#800080" },
  { label: "ピンク", value: "#FFC0CB" },
  { label: "グレー", value: "#808080" },
  { label: "茶色", value: "#A52A2A" },
  { label: "シアン", value: "#00FFFF" },
];

// 文字サイズリスト（5段階）
const sizes = ["極小", "小", "中", "大", "特大"];

/**
 * WYSIWYGエディタコンポーネント（Draft.js使用）
 */
export function WysiwygEditor({
  value,
  onChange,
  placeholder = "テキストを入力してください...",
  disabled = false,
}: WysiwygEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const decorator = new CompositeDecorator([]);
    return EditorState.createEmpty(decorator);
  });
  const editorRef = useRef<Editor>(null);

  // HTMLからEditorStateに変換（初回のみ）
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (!isInitialized && value) {
      try {
        // HTMLをパースしてtext-alignスタイルをブロックタイプに変換
        const parser = new DOMParser();
        const doc = parser.parseFromString(value, 'text/html');
        const divs = doc.querySelectorAll('div[style*="text-align"]');

        // text-alignスタイルとテキスト内容のマッピングを作成
        // 空のブロック（<br>のみ）も考慮
        const alignmentMap: Array<{ text: string; alignment: string; isEmpty: boolean }> = [];
        divs.forEach((div, index) => {
          const style = div.getAttribute('style') || '';
          const textAlignMatch = style.match(/text-align:\s*(left|center|right)/i);
          if (textAlignMatch) {
            const alignment = textAlignMatch[1].toLowerCase();
            const text = div.textContent || '';
            const isEmpty = text.trim() === '' || div.innerHTML.trim() === '<br>' || div.innerHTML.trim() === '';
            alignmentMap.push({
              text: isEmpty ? '' : text.trim(),
              alignment: `align-${alignment}`,
              isEmpty
            });
          }
        });

        // convertFromHTMLでブロックを取得
        const blocksFromHTML = convertFromHTML(value);
        let contentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );

        // ブロックタイプを設定（text-alignスタイルに基づいて）
        const blockMap = contentState.getBlockMap();
        let alignmentIndex = 0;
        blockMap.forEach((block, blockKey) => {
          if (!block || !blockKey) return;

          const blockText = block.getText().trim();
          const isEmpty = blockText === '';

          // 空のブロックの場合は、alignmentMapの順序に基づいてマッチング
          let alignmentInfo;
          if (isEmpty) {
            // 空のブロックの場合、alignmentMapから空のブロックを探す
            alignmentInfo = alignmentMap.find(item => item.isEmpty);
            if (alignmentInfo && alignmentIndex < alignmentMap.length) {
              alignmentInfo = alignmentMap[alignmentIndex];
              alignmentIndex++;
            }
          } else {
            // テキストがある場合は、テキストでマッチング
            alignmentInfo = alignmentMap.find(item => !item.isEmpty && item.text === blockText);
          }

          if (alignmentInfo) {
            // ブロックタイプを変更
            const selection = SelectionState.createEmpty(blockKey as string).merge({
              anchorOffset: 0,
              focusOffset: block.getLength(),
            });
            contentState = Modifier.setBlockType(contentState, selection, alignmentInfo.alignment);
          }
        });

        const newEditorState = EditorState.createWithContent(contentState);
        setEditorState(newEditorState);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error converting HTML to EditorState:", error);
        setIsInitialized(true);
      }
    } else if (!isInitialized && !value) {
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // EditorStateの変更をHTMLに変換して親に通知
  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const contentState = newEditorState.getCurrentContent();

    // カスタムスタイルマップを作成
    const customStyleMap: Record<string, any> = {};
    colors.forEach((color) => {
      customStyleMap[`COLOR-${color.value}`] = { element: "span", style: { color: color.value } };
    });
    sizes.forEach((size) => {
      customStyleMap[`SIZE-${size}`] = { element: "span", style: sizeStyleMap[size] };
    });

    // HTMLを生成（blockRenderersで配置を処理）
    const html = stateToHTML(contentState, {
      inlineStyles: {
        BOLD: { element: "strong" },
        ITALIC: { element: "em" },
        UNDERLINE: { element: "u" },
        STRIKETHROUGH: { element: "s" },
        ...customStyleMap,
      },
      blockRenderers: {
        'align-left': (block: any) => {
          // ブロックの内容を取得（インラインスタイルを含む）
          const blockKey = block.getKey();
          const blockMap = contentState.getBlockMap();
          const currentBlock = blockMap.get(blockKey);
          if (!currentBlock) return '';

          // ブロックのテキストを取得
          const text = currentBlock.getText();
          // 空のブロックも保持する（改行のみの場合）
          if (!text) {
            return '<div style="text-align: left;"><br></div>';
          }

          // このブロックだけをHTMLに変換（インラインスタイルを含む）
          // entityMapも含めてContentStateを作成
          const blockContentState = ContentState.createFromBlockArray(
            [currentBlock],
            contentState.getEntityMap()
          );
          const blockHtml = stateToHTML(blockContentState, {
            inlineStyles: {
              BOLD: { element: "strong" },
              ITALIC: { element: "em" },
              UNDERLINE: { element: "u" },
              STRIKETHROUGH: { element: "s" },
              ...customStyleMap,
            },
            entityStyleFn: (entity) => {
              const entityType = entity.getType();
              if (entityType === "LINK") {
                const data = entity.getData();
                return {
                  element: "a",
                  attributes: {
                    href: data.url,
                    target: "_blank",
                    rel: "nofollow noreferrer",
                  },
                };
              }
              return {};
            },
          });

          // text-alignスタイルを追加したdivでラップ
          // blockHtmlから最初のdivまたはpタグの内容を取得
          const contentMatch = blockHtml.match(/<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/);
          const content = contentMatch ? contentMatch[1] : text;

          return `<div style="text-align: left;">${content}</div>`;
        },
        'align-center': (block: any) => {
          const blockKey = block.getKey();
          const blockMap = contentState.getBlockMap();
          const currentBlock = blockMap.get(blockKey);
          if (!currentBlock) return '';
          const text = currentBlock.getText();
          // 空のブロックも保持する（改行のみの場合）
          if (!text) {
            return '<div style="text-align: center;"><br></div>';
          }

          const blockContentState = ContentState.createFromBlockArray(
            [currentBlock],
            contentState.getEntityMap()
          );
          const blockHtml = stateToHTML(blockContentState, {
            inlineStyles: {
              BOLD: { element: "strong" },
              ITALIC: { element: "em" },
              UNDERLINE: { element: "u" },
              STRIKETHROUGH: { element: "s" },
              ...customStyleMap,
            },
            entityStyleFn: (entity) => {
              const entityType = entity.getType();
              if (entityType === "LINK") {
                const data = entity.getData();
                return {
                  element: "a",
                  attributes: {
                    href: data.url,
                    target: "_blank",
                    rel: "nofollow noreferrer",
                  },
                };
              }
              return {};
            },
          });

          const contentMatch = blockHtml.match(/<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/);
          const content = contentMatch ? contentMatch[1] : text;

          return `<div style="text-align: center;">${content}</div>`;
        },
        'align-right': (block: any) => {
          const blockKey = block.getKey();
          const blockMap = contentState.getBlockMap();
          const currentBlock = blockMap.get(blockKey);
          if (!currentBlock) return '';
          const text = currentBlock.getText();
          // 空のブロックも保持する（改行のみの場合）
          if (!text) {
            return '<div style="text-align: right;"><br></div>';
          }

          const blockContentState = ContentState.createFromBlockArray(
            [currentBlock],
            contentState.getEntityMap()
          );
          const blockHtml = stateToHTML(blockContentState, {
            inlineStyles: {
              BOLD: { element: "strong" },
              ITALIC: { element: "em" },
              UNDERLINE: { element: "u" },
              STRIKETHROUGH: { element: "s" },
              ...customStyleMap,
            },
            entityStyleFn: (entity) => {
              const entityType = entity.getType();
              if (entityType === "LINK") {
                const data = entity.getData();
                return {
                  element: "a",
                  attributes: {
                    href: data.url,
                    target: "_blank",
                    rel: "nofollow noreferrer",
                  },
                };
              }
              return {};
            },
          });

          const contentMatch = blockHtml.match(/<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/);
          const content = contentMatch ? contentMatch[1] : text;

          return `<div style="text-align: right;">${content}</div>`;
        },
        'unstyled': (block: any) => {
          // 通常のブロック（空のブロックも保持）
          const blockKey = block.getKey();
          const blockMap = contentState.getBlockMap();
          const currentBlock = blockMap.get(blockKey);
          if (!currentBlock) return '';

          const text = currentBlock.getText();
          // 空のブロックも保持する（改行のみの場合）
          if (!text) {
            return '<div><br></div>';
          }

          // このブロックだけをHTMLに変換（インラインスタイルを含む）
          const blockContentState = ContentState.createFromBlockArray(
            [currentBlock],
            contentState.getEntityMap()
          );
          const blockHtml = stateToHTML(blockContentState, {
            inlineStyles: {
              BOLD: { element: "strong" },
              ITALIC: { element: "em" },
              UNDERLINE: { element: "u" },
              STRIKETHROUGH: { element: "s" },
              ...customStyleMap,
            },
            entityStyleFn: (entity) => {
              const entityType = entity.getType();
              if (entityType === "LINK") {
                const data = entity.getData();
                return {
                  element: "a",
                  attributes: {
                    href: data.url,
                    target: "_blank",
                    rel: "nofollow noreferrer",
                  },
                };
              }
              return {};
            },
          });

          // blockHtmlから最初のdivまたはpタグの内容を取得
          const contentMatch = blockHtml.match(/<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/);
          const content = contentMatch ? contentMatch[1] : text;

          return `<div>${content}</div>`;
        },
      },
      entityStyleFn: (entity) => {
        const entityType = entity.getType();
        if (entityType === "LINK") {
          const data = entity.getData();
          return {
            element: "a",
            attributes: {
              href: data.url,
              target: "_blank",
              rel: "nofollow noreferrer",
            },
          };
        }
        return {};
      },
    });

    onChange(html);
  };

  // インラインスタイルの適用
  const toggleInlineStyle = (inlineStyle: string) => {
    handleChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  // ブロックスタイルの適用（テキスト配置）
  const toggleBlockType = (blockType: string) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const blockKey = selection.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const currentBlockType = block.getType();

    // 既存の配置ブロックタイプを削除
    const alignmentTypes = ['align-left', 'align-center', 'align-right'];
    let newBlockType = currentBlockType;

    if (alignmentTypes.includes(currentBlockType)) {
      // 既存の配置ブロックタイプの場合は、unstyledに戻す
      newBlockType = 'unstyled';
    }

    // 新しいブロックタイプを適用
    if (blockType === 'left' || blockType === 'center' || blockType === 'right') {
      newBlockType = `align-${blockType}`;
    }

    const newContentState = Modifier.setBlockType(contentState, selection, newBlockType);
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      'change-block-type'
    );
    handleChange(newEditorState);
  };

  // ブロックスタイル関数（CSSクラスを適用）
  const blockStyleFn = (block: any) => {
    const blockType = block.getType();
    if (blockType === 'align-left') {
      return 'text-left';
    }
    if (blockType === 'align-center') {
      return 'text-center';
    }
    if (blockType === 'align-right') {
      return 'text-right';
    }
    return '';
  };

  // 文字色の適用
  const applyColor = (color: string) => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();
      // 既存の色スタイルを削除
      let newContentState = contentState;
      colors.forEach((c) => {
        newContentState = Modifier.removeInlineStyle(
          newContentState,
          selection,
          `COLOR-${c.value}`
        );
      });
      // 新しい色スタイルを適用
      newContentState = Modifier.applyInlineStyle(
        newContentState,
        selection,
        `COLOR-${color}`
      );
      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "change-inline-style"
      );
      handleChange(newEditorState);
    }
  };


  // 文字サイズの適用
  const applySize = (size: string) => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();
      // 既存のサイズスタイルを削除
      let newContentState = contentState;
      sizes.forEach((s) => {
        newContentState = Modifier.removeInlineStyle(
          newContentState,
          selection,
          `SIZE-${s}`
        );
      });
      // 新しいサイズスタイルを適用
      newContentState = Modifier.applyInlineStyle(
        newContentState,
        selection,
        `SIZE-${size}`
      );
      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "change-inline-style"
      );
      handleChange(newEditorState);
    }
  };

  // 現在のインラインスタイルを取得
  const getCurrentInlineStyle = () => {
    return editorState.getCurrentInlineStyle();
  };

  // カスタムスタイルレンダラー
  const styleFn = (style: string) => {
    if (style.startsWith("COLOR-")) {
      const color = style.replace("COLOR-", "");
      return { color };
    }
    if (style.startsWith("BGCOLOR-")) {
      const color = style.replace("BGCOLOR-", "");
      return { backgroundColor: color };
    }
    if (style.startsWith("SIZE-")) {
      const size = style.replace("SIZE-", "");
      return sizeStyleMap[size] || {};
    }
    return {};
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
        .wysiwyg-editor-toolbar button,
        .wysiwyg-editor-toolbar select {
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
        .wysiwyg-editor-toolbar select {
          min-width: 80px;
        }
        .wysiwyg-editor-content {
          padding: 1rem;
          min-height: 200px;
          font-size: 0.875rem;
        }
        .wysiwyg-editor-content .DraftEditor-root {
          min-height: 200px;
        }
        .wysiwyg-editor-content .DraftEditor-editorContainer {
          min-height: 200px;
        }
        .wysiwyg-editor-content .public-DraftEditor-content {
          min-height: 200px;
        }
        .wysiwyg-editor-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .wysiwyg-editor-content a:hover {
          color: #1d4ed8;
        }
        .wysiwyg-editor-content .text-left .public-DraftStyleDefault-block,
        .wysiwyg-editor-content .text-left .public-DraftStyleDefault-ltr {
          text-align: left;
        }
        .wysiwyg-editor-content .text-center .public-DraftStyleDefault-block,
        .wysiwyg-editor-content .text-center .public-DraftStyleDefault-ltr {
          text-align: center;
        }
        .wysiwyg-editor-content .text-right .public-DraftStyleDefault-block,
        .wysiwyg-editor-content .text-right .public-DraftStyleDefault-ltr {
          text-align: right;
        }
      `}</style>

      {/* ツールバー */}
      <div className="wysiwyg-editor-toolbar">
        {/* 文字サイズ */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              applySize(e.target.value);
            }
          }}
          disabled={disabled}
        >
          <option value="">サイズ</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        {/* 文字色 */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              applyColor(e.target.value);
            }
          }}
          disabled={disabled}
        >
          <option value="">文字色</option>
          {colors.map((color) => (
            <option key={color.value} value={color.value}>
              {color.label}
            </option>
          ))}
        </select>

        {/* 太字 */}
        <button
          type="button"
          onClick={() => toggleInlineStyle("BOLD")}
          disabled={disabled}
          className={getCurrentInlineStyle().has("BOLD") ? "active" : ""}
          title="太字"
        >
          <strong>B</strong>
        </button>

        {/* 斜体 */}
        <button
          type="button"
          onClick={() => toggleInlineStyle("ITALIC")}
          disabled={disabled}
          className={getCurrentInlineStyle().has("ITALIC") ? "active" : ""}
          title="斜体"
        >
          <em>I</em>
        </button>

        {/* 下線 */}
        <button
          type="button"
          onClick={() => toggleInlineStyle("UNDERLINE")}
          disabled={disabled}
          className={getCurrentInlineStyle().has("UNDERLINE") ? "active" : ""}
          title="下線"
        >
          <u>U</u>
        </button>

        {/* 取り消し線 */}
        <button
          type="button"
          onClick={() => toggleInlineStyle("STRIKETHROUGH")}
          disabled={disabled}
          className={
            getCurrentInlineStyle().has("STRIKETHROUGH") ? "active" : ""
          }
          title="取り消し線"
        >
          <s>S</s>
        </button>

        {/* 左揃え */}
        <button
          type="button"
          onClick={() => toggleBlockType("left")}
          disabled={disabled}
          title="左揃え"
        >
          ⬅
        </button>

        {/* 中央揃え */}
        <button
          type="button"
          onClick={() => toggleBlockType("center")}
          disabled={disabled}
          title="中央揃え"
        >
          ⬌
        </button>

        {/* 右揃え */}
        <button
          type="button"
          onClick={() => toggleBlockType("right")}
          disabled={disabled}
          title="右揃え"
        >
          ➡
        </button>

        {/* リンク */}
        <button
          type="button"
          onClick={() => {
            const url = prompt("URLを入力してください:");
            if (url) {
              const selection = editorState.getSelection();
              const contentState = editorState.getCurrentContent();
              const entityKey = contentState.createEntity("LINK", "MUTABLE", {
                url,
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
          }}
          disabled={disabled}
          title="リンク"
        >
          🔗
        </button>
      </div>

      {/* エディタ */}
      <div className="wysiwyg-editor-content">
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={disabled}
          blockStyleFn={blockStyleFn}
          customStyleMap={{
            ...Object.fromEntries(
              colors.map((color) => [`COLOR-${color.value}`, { color: color.value }])
            ),
            ...Object.fromEntries(
              sizes.map((size) => [`SIZE-${size}`, sizeStyleMap[size]])
            ),
          }}
        />
      </div>
    </div>
  );
}
