import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

function uploadRoot() {
  return process.env.UPLOAD_DIR?.trim() || "/var/www/akmaofficial-uploads";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: parts } = await params;
    const root = path.resolve(uploadRoot());
    const target = path.resolve(root, ...parts);

    if (!target.startsWith(`${root}${path.sep}`)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const info = await stat(target);
    if (!info.isFile() || info.size > 15 * 1024 * 1024) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = path.extname(target).toLowerCase();
    const data = await readFile(target);

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
