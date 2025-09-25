import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await request.json().catch(() => undefined);
  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
