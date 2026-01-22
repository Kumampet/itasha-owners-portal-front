"use client";

import { useEffect, useRef, useState } from "react";

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// フォントサイズの定義
const FONT_SIZES = {
  極小: "0.625rem", // 10px相当
  小: "0.75rem",    // 12px相当
  中: "0.875rem",   // 14px相当
  大: "1.125rem",   // 18px相当
  特大: "1.5rem",   // 24px相当
} as const;

// 代表的な12色
const COLORS = [
  { name: "黒", value: "#000000" },
  { name: "白", value: "#FFFFFF" },
  { name: "赤", value: "#EF4444" },
  { name: "青", value: "#3B82F6" },
  { name: "緑", value: "#10B981" },
  { name: "黄", value: "#F59E0B" },
  { name: "紫", value: "#8B5CF6" },
  { name: "ピンク", value: "#EC4899" },
  { name: "オレンジ", value: "#F97316" },
  { name: "シアン", value: "#06B6D4" },
  { name: "グレー", value: "#6B7280" },
  { name: "茶", value: "#92400E" },
] as const;

export function WysiwygEditor({
  value,
  onChange,
  placeholder = "入力してください",
  disabled = false,
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkTarget, setLinkTarget] = useState<"_self" | "_blank">("_blank");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const lastValueRef = useRef<string>("");
  const savedRangeRef = useRef<Range | null>(null);

  // valueが外部から変更された場合にエディタの内容を更新
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  // エディタの内容変更を検知して親に通知
  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastValueRef.current = html;
      onChange(html);
    }
  };

  // コマンドを実行するヘルパー関数
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // 太字を適用/解除
  const handleBold = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    // 選択範囲内にstrongタグがあるか確認
    const commonAncestor = range.commonAncestorContainer;
    let strongElement: HTMLElement | null = null;

    // 共通の祖先要素からstrongタグを探す
    if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      const element = commonAncestor as HTMLElement;
      if (element.tagName === "STRONG" || element.tagName === "B") {
        strongElement = element;
      } else {
        // 親要素を確認
        let parent = element.parentElement;
        while (parent && parent !== editorRef.current) {
          if (parent.tagName === "STRONG" || parent.tagName === "B") {
            strongElement = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
    } else if (commonAncestor.nodeType === Node.TEXT_NODE) {
      // テキストノードの場合、親要素を確認
      let parent = commonAncestor.parentElement;
      while (parent && parent !== editorRef.current) {
        if (parent.tagName === "STRONG" || parent.tagName === "B") {
          strongElement = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    // strongタグが見つかった場合は解除
    if (strongElement) {
      try {
        const parent = strongElement.parentElement;
        if (!parent) return;

        // strongタグの内容を親要素に移動
        const fragment = document.createDocumentFragment();
        while (strongElement.firstChild) {
          fragment.appendChild(strongElement.firstChild);
        }

        // strongタグの前に挿入
        parent.insertBefore(fragment, strongElement);
        parent.removeChild(strongElement);

        // 選択範囲を更新
        selection.removeAllRanges();
        const newRange = document.createRange();
        if (fragment.firstChild && fragment.lastChild) {
          newRange.setStartBefore(fragment.firstChild);
          newRange.setEndAfter(fragment.lastChild);
        } else if (fragment.firstChild) {
          newRange.setStartBefore(fragment.firstChild);
          newRange.setEndBefore(fragment.firstChild);
        }
        selection.addRange(newRange);

        editorRef.current?.focus();
        handleInput();
        return;
      } catch {
        // エラーが発生した場合はexecCommandにフォールバック
        execCommand("bold");
        return;
      }
    }

    // 選択範囲が空の場合は、次の入力に適用するためのマーカーを挿入
    if (range.collapsed) {
      const marker = document.createTextNode("\u200B");
      range.insertNode(marker);
      range.setStartAfter(marker);
      range.setEndAfter(marker);
    }

    try {
      // 選択範囲内のコンテンツをstrongで囲む
      const strong = document.createElement("strong");
      const contents = range.extractContents();
      strong.appendChild(contents);
      range.insertNode(strong);

      // 選択範囲を更新
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(strong);
      selection.addRange(newRange);
    } catch {
      // エラーが発生した場合はexecCommandにフォールバック
      execCommand("bold");
      return;
    }

    editorRef.current?.focus();
    handleInput();
  };

  // フォントサイズを適用
  const handleFontSize = (size: keyof typeof FONT_SIZES) => {
    const fontSize = FONT_SIZES[size];
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // 選択範囲が空の場合は、次の入力に適用するためのマーカーを挿入
    if (range.collapsed) {
      const marker = document.createTextNode("\u200B");
      range.insertNode(marker);
      range.setStartAfter(marker);
      range.setEndAfter(marker);
    }

    // 選択範囲内のコンテンツをspanで囲んでフォントサイズを適用
    try {
      const span = document.createElement("span");
      span.style.fontSize = fontSize;

      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      // 選択範囲を更新
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
    } catch {
      // エラーが発生した場合は、選択範囲内の要素に直接スタイルを適用
      const commonAncestor = range.commonAncestorContainer;
      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        const parent = commonAncestor.parentElement;
        if (parent) {
          parent.style.fontSize = fontSize;
        }
      } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
        (commonAncestor as HTMLElement).style.fontSize = fontSize;
      }
    }

    editorRef.current?.focus();
    handleInput();
  };

  // 色を適用
  const handleColor = (color: string) => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // 選択範囲が空の場合は、次の入力に適用するためのマーカーを挿入
    if (range.collapsed) {
      const marker = document.createTextNode("\u200B");
      range.insertNode(marker);
      range.setStartAfter(marker);
      range.setEndAfter(marker);
    }

    // 選択範囲内のコンテンツをspanで囲んで色を適用
    try {
      const span = document.createElement("span");
      span.style.color = color;

      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);

      // 選択範囲を更新
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
    } catch {
      // エラーが発生した場合は、選択範囲内の要素に直接スタイルを適用
      const commonAncestor = range.commonAncestorContainer;
      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        const parent = commonAncestor.parentElement;
        if (parent) {
          parent.style.color = color;
        }
      } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
        (commonAncestor as HTMLElement).style.color = color;
      }
    }

    editorRef.current?.focus();
    handleInput();
    setShowColorPicker(false);
  };

  // リンクを追加
  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      return;
    }

    if (!editorRef.current) {
      return;
    }

    // エディタにフォーカスを設定
    editorRef.current.focus();

    // 保存された選択範囲を使用
    let range: Range | null = null;
    const selection = window.getSelection();

    if (savedRangeRef.current) {
      // 保存された範囲を使用
      range = savedRangeRef.current;
    } else if (selection && selection.rangeCount > 0) {
      // 現在の選択範囲を使用
      range = selection.getRangeAt(0);
    }

    if (!range) {
      // 選択範囲がない場合は、カーソル位置にリンクを追加
      // カーソル位置を取得
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else {
        // カーソル位置が取得できない場合は、エディタの最後にカーソルを設定
        const newRange = document.createRange();
        newRange.selectNodeContents(editorRef.current);
        newRange.collapse(false); // false = 最後に
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        range = newRange;
      }
    }

    const linkText = linkTitle.trim() || linkUrl;

    // エディタ内の選択範囲か確認
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      // エディタ内でない場合は、エディタの最後にカーソルを設定してリンクを追加
      const newRange = document.createRange();
      newRange.selectNodeContents(editorRef.current);
      newRange.collapse(false); // false = 最後に
      range = newRange;
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // 選択範囲を復元
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // リンク要素を作成
    const link = document.createElement("a");
    link.href = linkUrl;
    link.target = linkTarget;
    link.rel = "nofollow noreferrer";
    link.textContent = linkText;

    if (range.collapsed) {
      // カーソル位置のみの場合、リンクを挿入
      range.insertNode(link);
      // カーソルをリンクの後に移動
      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.setEndAfter(link);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      // 選択範囲がある場合、選択範囲をリンクで置き換え
      range.deleteContents();
      range.insertNode(link);
      // カーソルをリンクの後に移動
      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.setEndAfter(link);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    setShowLinkDialog(false);
    setLinkUrl("");
    setLinkTitle("");
    setLinkTarget("_blank");
    savedRangeRef.current = null;
    editorRef.current.focus();
    handleInput();
  };

  // 現在のスタイル状態を取得
  const isActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  // リンクダイアログを開く
  const openLinkDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // 選択範囲を保存
      savedRangeRef.current = range.cloneRange();

      if (!range.collapsed) {
        const selectedText = range.toString();
        setLinkTitle(selectedText);
      } else {
        setLinkTitle("");
      }
    } else {
      savedRangeRef.current = null;
      setLinkTitle("");
    }
    setLinkUrl("");
    setLinkTarget("_blank");
    setShowLinkDialog(true);
  };

  return (
    <div className="wysiwyg-editor-wrapper border border-zinc-300 rounded-lg overflow-hidden bg-white">
      {/* ツールバー */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-300 bg-zinc-50">
        {/* フォントサイズ */}
        <select
          className="px-2 py-1 rounded-md bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 text-xs disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-zinc-900"
          disabled={disabled}
          title="フォントサイズ"
          onChange={(e) => {
            const size = e.target.value as keyof typeof FONT_SIZES;
            if (size) {
              handleFontSize(size);
              // 選択をリセット（同じサイズを再度選択できるように）
              e.target.value = "";
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            サイズ
          </option>
          {Object.keys(FONT_SIZES).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        {/* 太字 */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${isActive("bold")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            handleBold();
          }}
          disabled={disabled}
          title="太字"
        >
          <strong>B</strong>
        </button>

        {/* 斜体 */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${isActive("italic")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("italic");
          }}
          disabled={disabled}
          title="斜体"
        >
          <em>I</em>
        </button>

        {/* 下線 */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${isActive("underline")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("underline");
          }}
          disabled={disabled}
          title="下線"
        >
          <u>U</u>
        </button>

        {/* 取り消し線 */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${isActive("strikeThrough")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("strikeThrough");
          }}
          disabled={disabled}
          title="取り消し線"
        >
          <s>S</s>
        </button>

        {/* リスト */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${isActive("insertUnorderedList")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("insertUnorderedList");
          }}
          disabled={disabled}
          title="箇条書きリスト"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={isActive("insertUnorderedList") ? "text-white" : "text-zinc-700"}
          >
            <circle cx="3" cy="4" r="1.5" fill="currentColor" />
            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
            <circle cx="3" cy="12" r="1.5" fill="currentColor" />
            <line x1="6" y1="4" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* 数字リスト */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${isActive("insertOrderedList")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("insertOrderedList");
          }}
          disabled={disabled}
          title="番号付きリスト"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={isActive("insertOrderedList") ? "text-white" : "text-zinc-700"}
          >
            <text x="1.5" y="5.5" fontSize="8" fill="currentColor" fontFamily="Arial, sans-serif" fontWeight="600">1.</text>
            <text x="1.5" y="9.5" fontSize="8" fill="currentColor" fontFamily="Arial, sans-serif" fontWeight="600">2.</text>
            <text x="1.5" y="13.5" fontSize="8" fill="currentColor" fontFamily="Arial, sans-serif" fontWeight="600">3.</text>
            <line x1="5.5" y1="4" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5.5" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5.5" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* 左揃え */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${isActive("justifyLeft")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("justifyLeft");
          }}
          disabled={disabled}
          title="左揃え"
        >
          ⬅
        </button>

        {/* 中央揃え */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${isActive("justifyCenter")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("justifyCenter");
          }}
          disabled={disabled}
          title="中央揃え"
        >
          ⬌
        </button>

        {/* 右揃え */}
        <button
          type="button"
          className={`px-2 py-1 rounded-md border text-xs disabled:opacity-50 disabled:cursor-not-allowed ${isActive("justifyRight")
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("justifyRight");
          }}
          disabled={disabled}
          title="右揃え"
        >
          ➡
        </button>

        {/* リンク */}
        <div className="relative">
          <button
            ref={linkButtonRef}
            type="button"
            className="px-2 py-1 rounded-md bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            onMouseDown={(e) => {
              e.preventDefault();
              openLinkDialog();
            }}
            disabled={disabled}
            title="リンク"
          >
            🔗
          </button>
          {showLinkDialog && (
            <>
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setShowLinkDialog(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-[101] bg-white border border-zinc-300 rounded-lg shadow-lg p-4 min-w-[320px] max-w-[90vw]">
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
                      onChange={(e) =>
                        setLinkTarget(e.target.value as "_self" | "_blank")
                      }
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
        </div>

        {/* 色選択 */}
        <div className="relative group">
          <button
            type="button"
            className="px-2 py-1 rounded-md bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            title="文字色"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColorPicker(!showColorPicker);
            }}
          >
            🎨
          </button>
          {showColorPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowColorPicker(false)}
              />
              <div className="w-max absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-50 p-2 grid grid-cols-4 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="w-8 h-8 rounded border border-zinc-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleColor(color.value);
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* エディタエリア */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          handleInput();
        }}
        className="min-h-[200px] p-4 text-sm focus:outline-none"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Roboto", "Helvetica Neue", Arial, sans-serif',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

    </div>
  );
}
