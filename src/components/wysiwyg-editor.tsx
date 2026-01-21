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

  // convertFromHTMLが作成するリンクエンティティのデータ構造に対応
  // convertFromHTMLはurlプロパティを使用するが、hrefプロパティも確認
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
        // エディタ内でのクリックは編集モードを維持するため、デフォルトの動作を防ぐ
        e.preventDefault();
      }}
    >
      {children}
    </a>
  );
};

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
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkTarget, setLinkTarget] = useState<"_self" | "_blank">("_blank");
  const [linkDialogPosition, setLinkDialogPosition] = useState<{ top?: number; bottom?: number; left?: number }>({});

  // EditorStateをHTMLに変換する共通関数
  const convertEditorStateToHtml = (editorState: EditorState): string => {
    const contentState = editorState.getCurrentContent();

    // カスタムスタイルマップを作成
    const customStyleMap: Record<string, { element: string; style: React.CSSProperties }> = {};
    colors.forEach((color) => {
      customStyleMap[`COLOR-${color.value}`] = { element: "span", style: { color: color.value } };
    });
    sizes.forEach((size) => {
      customStyleMap[`SIZE-${size}`] = { element: "span", style: sizeStyleMap[size] };
    });

    // すべてのブロックを取得（空のブロックも含む）
    const blockMap = contentState.getBlockMap();
    const blocksArray = blockMap.toArray();

    // 空のブロックを明示的に処理するため、カスタムのHTML生成を行う
    let html = '';
    blocksArray.forEach((block) => {
      if (!block) return;

      const blockType = block.getType();
      const text = block.getText();
      const isEmpty = text === '';

      // 空のブロックの処理
      if (isEmpty) {
        if (blockType === 'align-left') {
          html += '<div style="text-align: left;"><br></div>';
        } else if (blockType === 'align-center') {
          html += '<div style="text-align: center;"><br></div>';
        } else if (blockType === 'align-right') {
          html += '<div style="text-align: right;"><br></div>';
        } else {
          html += '<div><br></div>';
        }
        return;
      }

      // テキストがあるブロックの処理
      const blockContentState = ContentState.createFromBlockArray(
        [block],
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
                target: data.target || "_blank",
                rel: "nofollow noreferrer",
              },
            };
          }
          return {};
        },
      });

      // blockHtmlから最初のdivまたはpタグの内容を取得
      // stateToHTMLが生成したHTMLには、strong、em、u、s、spanなどのタグが含まれている
      // このcontentをそのまま使用することで、文字色、太文字などのスタイルが保持される
      let content = '';
      if (blockHtml.trim()) {
        const contentMatch = blockHtml.match(/<(?:div|p)[^>]*>([\s\S]*?)<\/(?:div|p)>/);
        if (contentMatch && contentMatch[1]) {
          content = contentMatch[1];
        } else {
          // マッチしない場合（例：タグなしのテキストのみ）、blockHtml全体を使用
          content = blockHtml.trim();
        }
      }
      // blockHtmlが空の場合のみ、プレーンテキストを使用
      if (!content) {
        content = text;
      }

      // stateToHTMLがfontSizeを正しく処理しない場合があるため、
      // ブロック内のすべての文字範囲に対してfontSizeを確認し、必要に応じて修正
      // ブロック全体を走査して、各文字範囲のインラインスタイルを確認
      const blockLength = block.getLength();
      if (blockLength > 0 && content) {
        // ブロック内のすべての文字範囲を走査
        let currentOffset = 0;
        const fontSizeRanges: Array<{ start: number; end: number; fontSize: string }> = [];

        while (currentOffset < blockLength) {
          const inlineStyle = block.getInlineStyleAt(currentOffset);
          let fontSize: string | null = null;
          inlineStyle.forEach((style) => {
            if (style && style.startsWith('SIZE-')) {
              const size = style.replace('SIZE-', '');
              if (sizeStyleMap[size] && sizeStyleMap[size].fontSize) {
                fontSize = sizeStyleMap[size].fontSize as string;
              }
            }
          });

          if (fontSize) {
            // 同じfontSizeが続く範囲の終わりを見つける
            let endOffset = currentOffset + 1;
            while (endOffset < blockLength) {
              const nextInlineStyle = block.getInlineStyleAt(endOffset);
              let nextFontSize: string | null = null;
              nextInlineStyle.forEach((style) => {
                if (style && style.startsWith('SIZE-')) {
                  const size = style.replace('SIZE-', '');
                  if (sizeStyleMap[size] && sizeStyleMap[size].fontSize) {
                    nextFontSize = sizeStyleMap[size].fontSize as string;
                  }
                }
              });
              if (nextFontSize === fontSize) {
                endOffset++;
              } else {
                break;
              }
            }
            fontSizeRanges.push({ start: currentOffset, end: endOffset, fontSize });
            currentOffset = endOffset;
          } else {
            currentOffset++;
          }
        }

        // fontSizeが設定されている範囲に対して、content内の対応するテキストにfontSizeを追加
        if (fontSizeRanges.length > 0) {
          // 簡易的な方法：ブロック全体にfontSizeが適用されている場合のみ処理
          if (fontSizeRanges.length === 1 && fontSizeRanges[0].start === 0 && fontSizeRanges[0].end === blockLength) {
            // ブロック全体にfontSizeが適用されている場合
            const fontSize = fontSizeRanges[0].fontSize;
            // content内にfont-sizeが設定されていない場合のみ追加
            if (!content.match(/style=["'][^"']*font-size[^"']*["']/)) {
              // content内の最初のspanタグにfontSizeを追加、またはcontent全体をspanタグでラップ
              // ただし、contentが既にHTMLタグ（strong、em、u、s、aなど）を含んでいる場合は、それらを保持
              if (content.match(/^<span[^>]*>/)) {
                // 既にspanタグがある場合、style属性を追加または更新
                content = content.replace(
                  /^(<span)([^>]*)(>)/,
                  (match, tag, attrs, closing) => {
                    const styleMatch = attrs.match(/style=["']([^"']*)["']/);
                    if (styleMatch && styleMatch[1]) {
                      let style = styleMatch[1];
                      if (!style.includes('font-size:')) {
                        style += ` font-size: ${fontSize};`;
                        return `${tag}${attrs.replace(/style=["'][^"']*["']/, `style="${style}"`)}${closing}`;
                      }
                    } else {
                      return `${tag}${attrs} style="font-size: ${fontSize};"${closing}`;
                    }
                    return match;
                  }
                );
              } else {
                // spanタグがない場合、content全体をspanタグでラップ
                // contentには既にstrong、em、u、s、aなどのタグが含まれている可能性があるため、それらを保持
                content = `<span style="font-size: ${fontSize};">${content}</span>`;
              }
            }
          }
        }
      }

      // ブロックタイプに応じてdivでラップ
      if (blockType === 'align-left') {
        html += `<div style="text-align: left;">${content}</div>`;
      } else if (blockType === 'align-center') {
        html += `<div style="text-align: center;">${content}</div>`;
      } else if (blockType === 'align-right') {
        html += `<div style="text-align: right;">${content}</div>`;
      } else {
        html += `<div>${content}</div>`;
      }
    });

    return html;
  };


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
        divs.forEach((div) => {
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

        // HTML内のすべてのdivタグを取得（空のブロックも含む）
        // body直下のdivのみを取得（ネストされたdivは除外）
        const body = doc.body;
        const divBlocks: Array<{ text: string; isEmpty: boolean; alignment?: string }> = [];

        // body直下の子要素を順番に処理
        Array.from(body.childNodes).forEach((node) => {
          if (node.nodeType === 1 && (node as Element).tagName === 'DIV') {
            const div = node as HTMLDivElement;
            const text = div.textContent || '';
            const isEmpty = text.trim() === '' || div.innerHTML.trim() === '<br>' || div.innerHTML.trim() === '';
            const style = div.getAttribute('style') || '';
            const textAlignMatch = style.match(/text-align:\s*(left|center|right)/i);
            const alignment = textAlignMatch ? `align-${textAlignMatch[1].toLowerCase()}` : undefined;

            divBlocks.push({
              text: isEmpty ? '' : text.trim(),
              isEmpty,
              alignment
            });
          }
        });

        // convertFromHTMLでブロックを取得
        const blocksFromHTML = convertFromHTML(value);
        let contentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );

        // ブロックマップを取得（fontSize処理のため）
        const blockMap = contentState.getBlockMap();
        const blocksArray = blockMap.toArray();

        // HTML内のfontSizeスタイルを検出して、Draft.jsのインラインスタイルに変換
        // すべてのdivタグを順番に処理し、その中のspanタグのfontSizeを検出
        const divElements = Array.from(body.childNodes).filter(
          (node) => node.nodeType === 1 && (node as Element).tagName === 'DIV'
        ) as HTMLDivElement[];

        divElements.forEach((div, divIndex) => {
          // このdivに対応するブロックを取得
          if (divIndex >= blocksArray.length) return;
          const block = blocksArray[divIndex];
          if (!block) return;

          // div内のすべてのspanタグを取得（font-sizeとcolorの両方を処理）
          const spans = div.querySelectorAll('span[style]');
          spans.forEach((span) => {
            const style = span.getAttribute('style') || '';
            const spanText = span.textContent || '';
            if (!spanText) return;

            // ブロック内でこのテキストの位置を探す
            const blockText = block.getText();
            const textIndex = blockText.indexOf(spanText);
            if (textIndex === -1) return;

            const blockKey = block.getKey();
            const selection = SelectionState.createEmpty(blockKey).merge({
              anchorOffset: textIndex,
              focusOffset: textIndex + spanText.length,
            });

            // fontSizeの処理
            const fontSizeMatch = style.match(/font-size:\s*([^;]+)/i);
            if (fontSizeMatch) {
              const fontSize = fontSizeMatch[1].trim();
              // fontSizeから対応するサイズ名を取得
              let sizeName: string | null = null;
              for (const [name, styleProps] of Object.entries(sizeStyleMap)) {
                if (styleProps.fontSize === fontSize) {
                  sizeName = name;
                  break;
                }
              }

              if (sizeName) {
                // 既存のサイズスタイルを削除
                sizes.forEach((s) => {
                  contentState = Modifier.removeInlineStyle(
                    contentState,
                    selection,
                    `SIZE-${s}`
                  );
                });

                // 新しいサイズスタイルを適用
                contentState = Modifier.applyInlineStyle(
                  contentState,
                  selection,
                  `SIZE-${sizeName}`
                );
              }
            }

            // 文字色の処理
            const colorMatch = style.match(/color:\s*([^;]+)/i);
            if (colorMatch) {
              const colorValue = colorMatch[1].trim();
              // colorValueから対応する色名を取得
              // 色の値は#RRGGBB形式またはrgb()形式の可能性があるため、正規化が必要
              let colorName: string | null = null;
              for (const color of colors) {
                // 色の値を比較（大文字小文字を無視、空白を除去）
                const normalizedValue = colorValue.toLowerCase().replace(/\s/g, '');
                const normalizedColorValue = color.value.toLowerCase().replace(/\s/g, '');
                if (normalizedValue === normalizedColorValue) {
                  colorName = color.value;
                  break;
                }
              }

              if (colorName) {
                // 既存の色スタイルを削除
                colors.forEach((c) => {
                  contentState = Modifier.removeInlineStyle(
                    contentState,
                    selection,
                    `COLOR-${c.value}`
                  );
                });

                // 新しい色スタイルを適用
                contentState = Modifier.applyInlineStyle(
                  contentState,
                  selection,
                  `COLOR-${colorName}`
                );
              }
            }
          });
        });

        // ブロックタイプを設定（text-alignスタイルに基づいて）
        // HTML内のdivの順序とブロックの順序を正確にマッチング
        // 注意: fontSize処理でcontentStateが変更されている可能性があるため再取得
        const blockMapForAlignment = contentState.getBlockMap();
        const blocksArrayForAlignment = blockMapForAlignment.toArray();

        let divIndex = 0;
        let blockIndex = 0;

        // HTML内のdivとブロックを順番にマッチング
        while (divIndex < divBlocks.length && blockIndex < blocksArrayForAlignment.length) {
          const divBlock = divBlocks[divIndex];
          const block = blocksArrayForAlignment[blockIndex];

          if (!block) {
            blockIndex++;
            continue;
          }

          const blockText = block.getText().trim();
          const isEmpty = blockText === '';

          // テキストが一致するか、空のブロックの場合はブロックタイプを設定
          if ((isEmpty && divBlock.isEmpty) || (!isEmpty && !divBlock.isEmpty && divBlock.text === blockText)) {
            if (divBlock.alignment) {
              const blockKey = block.getKey();
              const selection = SelectionState.createEmpty(blockKey).merge({
                anchorOffset: 0,
                focusOffset: block.getLength(),
              });
              contentState = Modifier.setBlockType(contentState, selection, divBlock.alignment);
            }
            divIndex++;
            blockIndex++;
          } else if (divBlock.isEmpty && !isEmpty) {
            // HTMLに空のブロックがあるが、convertFromHTMLがスキップした場合
            // 現在のブロックの前に空のブロックを挿入
            const blockKey = block.getKey();
            const selection = SelectionState.createEmpty(blockKey).merge({
              anchorOffset: 0,
              focusOffset: 0,
            });
            const newContentState = Modifier.insertText(
              contentState,
              selection,
              '\n'
            );
            const newBlockMap = newContentState.getBlockMap();
            const newBlocksArray = newBlockMap.toArray();
            const newBlockKey = newBlocksArray[blockIndex]?.getKey();
            if (newBlockKey) {
              const newSelection = SelectionState.createEmpty(newBlockKey).merge({
                anchorOffset: 0,
                focusOffset: 1,
              });
              const finalContentState = Modifier.setBlockType(
                newContentState,
                newSelection,
                divBlock.alignment || 'unstyled'
              );
              contentState = finalContentState;
              // ブロック配列を再取得
              const reUpdatedBlockMap = contentState.getBlockMap();
              const reUpdatedBlocksArray = reUpdatedBlockMap.toArray();
              blocksArrayForAlignment.length = 0;
              blocksArrayForAlignment.push(...reUpdatedBlocksArray);
              divIndex++;
              // blockIndexはそのまま（空のブロックが挿入されたため）
            } else {
              divIndex++;
            }
          } else {
            // マッチしない場合、次のブロックを確認
            blockIndex++;
          }
        }

        // 残っている空のブロックを追加（convertFromHTMLがスキップした場合）
        while (divIndex < divBlocks.length) {
          const divBlock = divBlocks[divIndex];
          if (divBlock.isEmpty) {
            // 最後に空のブロックを追加
            const lastBlock = contentState.getBlockMap().last();
            if (lastBlock) {
              const lastBlockKey = lastBlock.getKey();
              const selection = SelectionState.createEmpty(lastBlockKey).merge({
                anchorOffset: lastBlock.getLength(),
                focusOffset: lastBlock.getLength(),
              });
              const newContentState = Modifier.insertText(
                contentState,
                selection,
                '\n'
              );
              const newBlockMap = newContentState.getBlockMap();
              const newBlocksArray = newBlockMap.toArray();
              const newBlockKey = newBlocksArray[newBlocksArray.length - 1]?.getKey();
              if (newBlockKey) {
                const newSelection = SelectionState.createEmpty(newBlockKey).merge({
                  anchorOffset: 0,
                  focusOffset: 1,
                });
                const finalContentState = Modifier.setBlockType(
                  newContentState,
                  newSelection,
                  divBlock.alignment || 'unstyled'
                );
                contentState = finalContentState;
              }
            }
          }
          divIndex++;
        }

        // デコレータを適用してEditorStateを作成
        const decorator = new CompositeDecorator([
          {
            strategy: findLinkEntities,
            component: LinkComponent,
          },
        ]);
        const newEditorState = EditorState.createWithContent(contentState, decorator);
        setEditorState(newEditorState);
        setIsInitialized(true);

        // 初期化時に現在のEditorStateをHTMLに変換してonChangeを呼び出す
        // これにより、エディタで何も変更しない場合でも、空のブロックが保持される
        const initialHtml = convertEditorStateToHtml(newEditorState);
        onChange(initialHtml);
      } catch (error) {
        console.error("Error converting HTML to EditorState:", error);
        setIsInitialized(true);
      }
    } else if (!isInitialized && !value) {
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isInitialized]);

  // EditorStateの変更をHTMLに変換して親に通知
  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    const html = convertEditorStateToHtml(newEditorState);
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
      // カーソル位置のみの場合、タイトルをテキストとして挿入してリンクを適用
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

      // カーソルを挿入したテキストの後に移動
      const newSelection = selection.merge({
        anchorOffset: selection.getStartOffset() + textToInsert.length,
        focusOffset: selection.getStartOffset() + textToInsert.length,
      });

      handleChange(EditorState.forceSelection(newEditorState, newSelection));
    } else {
      // 選択範囲がある場合、その範囲にリンクを適用
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
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    // 選択範囲がない場合（カーソル位置のみ）、現在のブロック全体を選択
    if (selection.isCollapsed()) {
      const blockKey = selection.getStartKey();
      const block = contentState.getBlockForKey(blockKey);
      const blockLength = block.getLength();

      if (blockLength > 0) {
        // ブロック全体を選択範囲として設定
        const newSelection = selection.merge({
          anchorOffset: 0,
          focusOffset: blockLength,
        });
        const newEditorState = EditorState.forceSelection(editorState, newSelection);
        handleChange(RichUtils.toggleInlineStyle(newEditorState, inlineStyle));
        return;
      }
    }

    // 選択範囲がある場合、通常通り処理
    // RichUtils.toggleInlineStyleを使用してスタイルをトグル
    const newEditorState = RichUtils.toggleInlineStyle(editorState, inlineStyle);
    handleChange(newEditorState);
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
  const blockStyleFn = (block: ContentBlock) => {
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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Roboto", "Helvetica Neue", Arial, sans-serif;
        }
        .wysiwyg-editor-content .DraftEditor-root {
          min-height: 200px;
          font-family: inherit;
        }
        .wysiwyg-editor-content .DraftEditor-editorContainer {
          min-height: 200px;
          font-family: inherit;
        }
        .wysiwyg-editor-content .public-DraftEditor-content {
          min-height: 200px;
          font-family: inherit;
        }
        .wysiwyg-editor-content .public-DraftStyleDefault-block {
          font-family: inherit;
        }
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr {
          font-family: inherit;
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
        /* Draft.jsのインラインスタイル用のCSS */
        /* BOLDスタイルが適用されたspanタグ - より具体的なセレクタで確実に適用 */
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-weight"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-weight: bold"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-weight:bold"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-weight: 700"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-weight:700"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-weight"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-weight: bold"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-weight:bold"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-weight: 700"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-weight:700"],
        .wysiwyg-editor-content span[data-offset-key][style*="font-weight"] {
          font-weight: 700 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Roboto", "Helvetica Neue", Arial, sans-serif !important;
        }
        /* ITALICスタイルが適用されたspanタグ */
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-style"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-style: italic"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="font-style:italic"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-style"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-style: italic"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="font-style:italic"] {
          font-style: italic !important;
        }
        /* UNDERLINEスタイルが適用されたspanタグ */
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="text-decoration"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="text-decoration: underline"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="text-decoration:underline"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="text-decoration"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="text-decoration: underline"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="text-decoration:underline"] {
          text-decoration: underline !important;
        }
        /* STRIKETHROUGHスタイルが適用されたspanタグ */
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="text-decoration: line-through"],
        .wysiwyg-editor-content .public-DraftStyleDefault-block span[style*="text-decoration:line-through"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="text-decoration: line-through"],
        .wysiwyg-editor-content .public-DraftStyleDefault-ltr span[style*="text-decoration:line-through"] {
          text-decoration: line-through !important;
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
        <div className="relative">
          <button
            ref={linkButtonRef}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              // ボタンの位置を取得してダイアログの位置を計算
              if (linkButtonRef.current) {
                const rect = linkButtonRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                const dialogHeight = 300; // ダイアログの推定高さ
                const dialogWidth = 320; // ダイアログの幅
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;

                let top: number | undefined;
                let bottom: number | undefined;
                let left: number;

                // 縦方向の位置を決定
                if (spaceBelow < dialogHeight && spaceAbove > spaceBelow) {
                  // 下にスペースがない場合、上に表示
                  bottom = viewportHeight - rect.top + 4;
                } else {
                  // 通常は下に表示
                  top = rect.bottom + 4;
                }

                // 横方向の位置を決定（画面からはみ出さないように）
                if (rect.left + dialogWidth > viewportWidth) {
                  // 右側にはみ出す場合、左側に調整
                  left = Math.max(8, viewportWidth - dialogWidth - 8);
                } else {
                  left = rect.left;
                }

                setLinkDialogPosition({ top, bottom, left });
              }

              setShowLinkDialog(true);
              // 選択範囲のテキストを取得してタイトルに設定
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

          {/* リンク追加ダイアログ */}
          {showLinkDialog && (
            <>
              {/* オーバーレイ */}
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setShowLinkDialog(false)}
              />
              {/* ダイアログ */}
              <div
                className="fixed z-[101] bg-white border border-zinc-300 rounded-lg shadow-lg p-4 min-w-[320px] max-w-[90vw]"
                style={{
                  ...(linkDialogPosition.top !== undefined ? { top: `${linkDialogPosition.top}px` } : {}),
                  ...(linkDialogPosition.bottom !== undefined ? { bottom: `${linkDialogPosition.bottom}px` } : {}),
                  ...(linkDialogPosition.left !== undefined ? { left: `${linkDialogPosition.left}px` } : {}),
                }}
              >
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
                          // リンクを追加する処理を実行
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
                      className="px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-900 text-zinc-900 hover:bg-zinc-800 disabled:hover:bg-zinc-900"
                    >
                      リンクを追加
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
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
            // デフォルトのインラインスタイル
            BOLD: { fontWeight: 'bold' },
            ITALIC: { fontStyle: 'italic' },
            UNDERLINE: { textDecoration: 'underline' },
            STRIKETHROUGH: { textDecoration: 'line-through' },
            // カスタムスタイル
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
