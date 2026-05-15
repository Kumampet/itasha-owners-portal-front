"use client";

type DateTimeInputProps = {
    value: string;
    onChange: (value: string) => void;
    type?: "date" | "datetime-local";
    placeholder?: string;
    required?: boolean;
    min?: string;
    max?: string;
    className?: string;
    id?: string;
    disabled?: boolean;
};

/**
 * 日時入力コンポーネント
 * 入力領域全体をクリックするとカレンダーが開きます
 * モダンブラウザではshowPicker() APIを使用してカレンダーを表示します
 */
export function DateTimeInput({
    value,
    onChange,
    type = "date",
    placeholder,
    required = false,
    min,
    max,
    className = "",
    id,
    disabled = false,
}: DateTimeInputProps) {
    return (
        <div className="relative">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
                disabled={disabled}
                id={id}
                className={`block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 ${className} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    }`}
                onClick={(e) => {
                    if (disabled) return;
                    // モダンブラウザではshowPicker()メソッドを使用してカレンダーを表示
                    const input = e.currentTarget as HTMLInputElement;
                    if (typeof input.showPicker === "function") {
                        try {
                            input.showPicker();
                        } catch (error) {
                            // showPicker()がエラーを返した場合は無視（一部のブラウザで制限がある場合がある）
                            // ユーザーが手動でカレンダーアイコンをクリックすることもできます
                            console.debug("showPicker() error (safe to ignore):", error);
                        }
                    }
                }}
            />
        </div>
    );
}
