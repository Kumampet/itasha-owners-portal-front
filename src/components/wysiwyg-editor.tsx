"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// React Quillを動的インポート（SSRを回避）
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * WYSIWYGエディタコンポーネント
 * React Quillを使用してリッチテキストエディタを提供
 */
export function WysiwygEditor({
  value,
  onChange,
  placeholder = "テキストを入力してください...",
  disabled = false,
}: WysiwygEditorProps) {
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

  // React Quillの設定
  const modules = {
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
  };

  const formats = [
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
  ];

  // Quillの設定をカスタマイズ
  useEffect(() => {
    if (typeof window !== "undefined" && quillRef.current) {
      const ReactQuillLib = require("react-quill");
      const Quill = ReactQuillLib.default.Quill || ReactQuillLib.Quill;
      
      if (Quill) {
        // フォントのホワイトリストを設定
        const Font = Quill.import("formats/font");
        Font.whitelist = fonts;
        Quill.register(Font, true);

        // サイズのホワイトリストを設定
        const Size = Quill.import("formats/size");
        Size.whitelist = sizes;
        Quill.register(Size, true);
      }
    }
  }, []);

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
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
      />
    </div>
  );
}
