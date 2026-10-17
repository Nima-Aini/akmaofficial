import type { CSSProperties, ReactNode } from "react";
import { normalizeRichTextValue, type RichTextValue } from "@/lib/rich-text";

export function RichText({
  value,
  fallback,
  as: Wrapper = "span",
  className,
}: {
  value?: RichTextValue | null;
  fallback: string;
  as?: "span" | "p" | "div";
  className?: string;
}) {
  const normalized = normalizeRichTextValue(value, fallback);
  const children: ReactNode = normalized.segments.map((segment, index) => (
    <span
      key={`${index}-${segment.text.slice(0, 12)}`}
      style={segment.color ? ({ color: segment.color } satisfies CSSProperties) : undefined}
      className={segment.bold ? "font-bold" : undefined}
    >
      {segment.text}
    </span>
  ));
  return <Wrapper className={className}>{children}</Wrapper>;
}
