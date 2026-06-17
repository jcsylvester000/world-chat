import { NextResponse } from "next/server";
import * as repo from "@/server/repos/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/groups?userId=x → groups the user belongs to or created
export async function GET(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    return NextResponse.json(await repo.listGroupsForUser(userId));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/groups → { name, createdByEmail, memberEmails } (Basic cap enforced)
export async function POST(req: Request) {
  try {
    const { name, createdByEmail, memberEmails } = await req.json();
    return NextResponse.json(
      await repo.createGroup(name, createdByEmail, memberEmails ?? []),
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
