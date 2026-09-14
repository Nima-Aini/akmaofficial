import type { ReactNode } from "react";
/* eslint-disable @next/next/no-img-element */
import type { BlogContentBlock } from "@/db/schema";

function safeHref(href: string) {
  return href.startsWith("/") || /^https?:\/\//i.test(href) || /^(mailto|tel):/i.test(href) ? href : "#";
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) { const href = safeHref(link[2]); return <a key={index} href={href} className="font-bold text-accent underline decoration-accent/40 underline-offset-4" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link[1]}</a>; }
    return part;
  });
}

export function BlogContent({ blocks }: { blocks: BlogContentBlock[] }) {
  return <div className="blog-content">{blocks.map((block) => {
    if (block.type === "h2") return <h2 key={block.id}>{inline(block.text ?? "")}</h2>;
    if (block.type === "h3") return <h3 key={block.id}>{inline(block.text ?? "")}</h3>;
    if (block.type === "quote") return <blockquote key={block.id}>{inline(block.text ?? "")}</blockquote>;
    if (block.type === "bulletList") return <ul key={block.id}>{(block.items ?? []).filter(Boolean).map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>;
    if (block.type === "numberedList") return <ol key={block.id}>{(block.items ?? []).filter(Boolean).map((item, index) => <li key={index}>{inline(item)}</li>)}</ol>;
    if (block.type === "image" && block.url) return <figure key={block.id}><img src={block.url} alt={block.alt || "تصویر مقاله آکما"} width="1400" height="933" loading="lazy" />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
    if (block.type === "divider") return <hr key={block.id} />;
    return <p key={block.id}>{inline(block.text ?? "")}</p>;
  })}</div>;
}
