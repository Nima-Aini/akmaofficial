import { redirect } from "next/navigation";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; q?: string }>;
}) {
  const params = await searchParams;
  const code = params.code || params.q || "";
  if (code) {
    redirect(`/tracking?code=${encodeURIComponent(code)}`);
  }
  redirect("/tracking");
}
