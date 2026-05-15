"use client";

interface TagProps {
    children: string;
    className?: string;
}

export function Tag({ children, className = "" }: TagProps) {
    const baseClasses = "rounded-full bg-card-elevated px-3 py-1 text-xs font-medium text-muted-foreground";
    const combinedClassName = `${baseClasses} ${className}`.trim();

    return (
        <span className={combinedClassName}>
            {children}
        </span>
    );
}

interface TagListProps {
    tags: Array<{ tag: { name: string } } | { name: string } | string>;
    className?: string;
}

export function TagList({ tags, className = "" }: TagListProps) {
    if (tags.length === 0) {
        return null;
    }

    const baseClasses = "flex flex-wrap gap-2";
    const combinedClassName = `${baseClasses} ${className}`.trim();

    return (
        <div className={combinedClassName || undefined}>
            {tags.map((tag, idx) => {
                const tagName = typeof tag === "string" 
                    ? tag 
                    : "name" in tag 
                        ? tag.name 
                        : tag.tag.name;
                
                return (
                    <Tag key={idx}>
                        {tagName}
                    </Tag>
                );
            })}
        </div>
    );
}

