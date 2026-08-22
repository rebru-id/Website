// src/app/api/cron/daily-schedule-sync/route.ts
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runDailyScheduleSync } from "@/lib/supabase-collector";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = createServiceClient();
    const result = await runDailyScheduleSync(client);

    console.log("[cron.daily-schedule-sync]", JSON.stringify(result));

    if (result.errors.length > 0) {
      reportError(
        "cron.daily-schedule-sync.partialFailure",
        new Error(
          `${result.errors.length} partner gagal di-generate: ${result.errors
            .map((e) => `${e.organization} (${e.message})`)
            .join("; ")}`,
        ),
        "warn",
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    reportError("cron.daily-schedule-sync.fatal", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
