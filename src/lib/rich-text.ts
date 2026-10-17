export type RichTextSegment = {
  text: string;
  bold?: boolean;
  color?: string;
};

export type RichTextValue = {
  segments: RichTextSegment[];
};

export type RichTextMap = Record<string, RichTextValue>;

export const RICH_TEXT_COLORS = [
  { label: "زرشکی آکما", value: "#780B18" },
  { label: "قرمز آکما", value: "#E91239" },
  { label: "تیره", value: "#191919" },
  { label: "سفید", value: "#FFFFFF" },
  { label: "کرم", value: "#FFFCF8" },
  { label: "خاکستری", value: "#77716C" },
] as const;

export function sanitizeTextColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : undefined;
}

export function sanitizeRichTextValue(value: unknown, maxLength = 20_000): RichTextValue | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.segments)) return undefined;
  let remaining = Math.max(0, maxLength);
  const segments: RichTextSegment[] = [];
  for (const item of raw.segments.slice(0, 300)) {
    if (!item || typeof item !== "object" || Array.isArray(item) || remaining <= 0) continue;
    const segment = item as Record<string, unknown>;
    if (typeof segment.text !== "string") continue;
    const text = segment.text.slice(0, remaining);
    remaining -= text.length;
    if (!text) continue;
    const color = sanitizeTextColor(segment.color);
    segments.push({ text, ...(segment.bold === true ? { bold: true } : {}), ...(color ? { color } : {}) });
  }
  return segments.length ? { segments: mergeAdjacentSegments(segments) } : undefined;
}

export function sanitizeRichTextMap(value: unknown, maxEntries = 100): RichTextMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: RichTextMap = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>).slice(0, maxEntries)) {
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(key)) continue;
    const clean = sanitizeRichTextValue(raw);
    if (clean) result[key] = clean;
  }
  return result;
}

export function sanitizeRichTextMetadataDeep(value: unknown, depth = 0): unknown {
  if (depth > 8) return null;
  if (Array.isArray(value)) return value.slice(0, 500).map((item) => sanitizeRichTextMetadataDeep(item, depth + 1));
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 500)) {
    if (key === "textFormatting") {
      result[key] = sanitizeRichTextMap(item);
    } else if (key.endsWith("RichText")) {
      result[key] = sanitizeRichTextValue(item) ?? { segments: [] };
    } else if (key.endsWith("RichTextList")) {
      result[key] = Array.isArray(item) ? item.slice(0, 100).map((entry) => sanitizeRichTextValue(entry, 2_000) ?? { segments: [] }) : [];
    } else {
      result[key] = sanitizeRichTextMetadataDeep(item, depth + 1);
    }
  }
  return result;
}

export function richTextToPlainText(value: unknown, fallback = ""): string {
  const clean = sanitizeRichTextValue(value);
  return clean ? clean.segments.map((segment) => segment.text).join("") : fallback;
}

export function normalizeRichTextValue(value: unknown, fallback: string): RichTextValue {
  const clean = sanitizeRichTextValue(value);
  if (!clean || richTextToPlainText(clean) !== fallback) return { segments: fallback ? [{ text: fallback }] : [] };
  return clean;
}

function sameMarks(a: RichTextSegment, b: RichTextSegment) {
  return Boolean(a.bold) === Boolean(b.bold) && (a.color ?? "") === (b.color ?? "");
}

export function mergeAdjacentSegments(segments: RichTextSegment[]): RichTextSegment[] {
  const merged: RichTextSegment[] = [];
  for (const segment of segments) {
    if (!segment.text) continue;
    const previous = merged.at(-1);
    if (previous && sameMarks(previous, segment)) previous.text += segment.text;
    else merged.push({ ...segment });
  }
  return merged;
}

function splitAt(segments: RichTextSegment[], offset: number): [RichTextSegment[], RichTextSegment[]] {
  const before: RichTextSegment[] = [];
  const after: RichTextSegment[] = [];
  let cursor = 0;
  for (const segment of segments) {
    const end = cursor + segment.text.length;
    if (end <= offset) before.push({ ...segment });
    else if (cursor >= offset) after.push({ ...segment });
    else {
      const local = offset - cursor;
      before.push({ ...segment, text: segment.text.slice(0, local) });
      after.push({ ...segment, text: segment.text.slice(local) });
    }
    cursor = end;
  }
  return [before.filter((item) => item.text), after.filter((item) => item.text)];
}

export function applyRichTextMark(
  value: RichTextValue,
  start: number,
  end: number,
  mark: { bold?: boolean | null; color?: string | null },
): RichTextValue {
  const plain = richTextToPlainText(value);
  const from = Math.max(0, Math.min(start, end, plain.length));
  const to = Math.max(from, Math.min(Math.max(start, end), plain.length));
  if (from === to) return value;
  const [before, tail] = splitAt(value.segments, from);
  const [selected, after] = splitAt(tail, to - from);
  const changed = selected.map((segment) => ({
    ...segment,
    ...(mark.bold === null ? { bold: undefined } : mark.bold === undefined ? {} : { bold: mark.bold }),
    ...(mark.color === null ? { color: undefined } : mark.color === undefined ? {} : { color: sanitizeTextColor(mark.color) }),
  }));
  return { segments: mergeAdjacentSegments([...before, ...changed, ...after]) };
}

export function replaceRichTextPlainText(value: RichTextValue, nextText: string): RichTextValue {
  const previous = richTextToPlainText(value);
  if (previous === nextText) return value;
  let prefix = 0;
  while (prefix < previous.length && prefix < nextText.length && previous[prefix] === nextText[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < nextText.length - prefix &&
    previous[previous.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) suffix += 1;
  const [before, oldTail] = splitAt(value.segments, prefix);
  const [, after] = splitAt(oldTail, previous.length - prefix - suffix);
  const inserted = nextText.slice(prefix, nextText.length - suffix);
  const inherited = before.at(-1) ?? after[0] ?? { text: "" };
  return {
    segments: mergeAdjacentSegments([
      ...before,
      ...(inserted ? [{ text: inserted, ...(inherited.bold ? { bold: true } : {}), ...(inherited.color ? { color: inherited.color } : {}) }] : []),
      ...after,
    ]),
  };
}
