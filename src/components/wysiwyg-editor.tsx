"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "quill/dist/quill.snow.css";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * WYSIWYGエディタコンポーネント
 * Quillを直接使用してReact 19互換のリッチテキストエディタを提供
 */
export function WysiwygEditor({
  value,
  onChange,
  placeholder = "テキストを入力してください...",
  disabled = false,
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  // フォントリスト（10種類）
  const fonts = [
    "noto-sans-jp",
    "roboto",
    "open-sans",
    "lato",
    "montserrat",
    "playfair-display",
    "pacifico",
    "bebas-neue",
    "dancing-script",
    "poppins",
  ];

  // 文字色リスト（12色）
  const colors = [
    "#000000", // 黒
    "#FFFFFF", // 白
    "#FF0000", // 赤
    "#0000FF", // 青
    "#008000", // 緑
    "#FFFF00", // 黄
    "#FFA500", // オレンジ
    "#800080", // 紫
    "#FFC0CB", // ピンク
    "#808080", // グレー
    "#A52A2A", // 茶色
    "#00FFFF", // シアン
  ];

  // 文字サイズリスト（5段階）
  const sizes = ["極小", "小", "中", "大", "特大"];

  useEffect(() => {
    if (typeof window === "undefined" || !editorRef.current) {
      return;
    }

    // 既にQuillが初期化されている場合はスキップ
    if (quillRef.current) {
      return;
    }

    let isMounted = true;

    // Quillを動的インポート
    import("quill").then((QuillModule) => {
      if (!isMounted || !editorRef.current || quillRef.current) {
        return;
      }

      const Quill = QuillModule.default;

      // フォントのホワイトリストを設定（一度だけ）
      if (!Quill.imports["formats/font"].whitelist || Quill.imports["formats/font"].whitelist.length === 0) {
        const Font = Quill.import("formats/font");
        Font.whitelist = fonts;
        Quill.register(Font, true);
      }

      // サイズのホワイトリストを設定（一度だけ）
      if (!Quill.imports["formats/size"].whitelist || Quill.imports["formats/size"].whitelist.length === 0) {
        const Size = Quill.import("formats/size");
        Size.whitelist = sizes;
        Quill.register(Size, true);
      }

      // 既存のコンテンツをクリア（ツールバーの重複を防ぐ）
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }

      // Quillエディタを初期化
      const quill = new Quill(editorRef.current!, {
        theme: "snow",
        placeholder,
        readOnly: disabled,
        modules: {
          toolbar: {
            container: [
              [{ font: fonts }],
              [{ size: sizes }],
              [{ color: colors }, { background: colors }],
              ["bold", "italic", "underline", "strike"],
              [{ align: [] }],
              ["link"],
              ["clean"],
            ],
          },
        },
        formats: [
          "font",
          "size",
          "color",
          "background",
          "bold",
          "italic",
          "underline",
          "strike",
          "align",
          "link",
        ],
      });

      // 初期値を設定
      if (value) {
        quill.root.innerHTML = value;
      }

      // 変更イベントを監視
      quill.on("text-change", () => {
        if (isMounted) {
          const html = quill.root.innerHTML;
          onChange(html);
        }
      });

      quillRef.current = quill;
    });

    return () => {
      isMounted = false;
      if (quillRef.current && editorRef.current) {
        // Quillインスタンスを破棄
        const quill = quillRef.current;
        quill.off("text-change");
        // エディタのDOMをクリーンアップ
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }
        quillRef.current = null;
      }
    };
  }, []); // 空の依存配列で一度だけ実行

  // 外部からの値の変更を反映
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value || "";
    }
  }, [value]);

  // disabled状態の変更を反映
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled]);

  return (
    <div className="wysiwyg-editor-wrapper">
      <style jsx global>{`
        .wysiwyg-editor-wrapper .ql-container {
          font-size: 14px;
          min-height: 200px;
        }
        .wysiwyg-editor-wrapper .ql-editor {
          min-height: 200px;
        }
        .wysiwyg-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        /* WYSIWYGエディタ内のリンクのスタイル */
        .wysiwyg-editor-wrapper .ql-editor a {
          color: #2563eb !important; /* 標準の青色 */
          text-decoration: underline;
        }
        .wysiwyg-editor-wrapper .ql-editor a:hover {
          color: #1d4ed8 !important; /* ホバー時の濃い青色 */
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
}
