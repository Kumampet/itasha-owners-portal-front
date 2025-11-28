type LoadingSpinnerProps = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 ${className}`}
      aria-label="読み込み中"
      role="status"
    >
      <span className="sr-only">読み込み中</span>
    </div>
  );
}

