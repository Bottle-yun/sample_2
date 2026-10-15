import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
  if (!url) {
    return NextResponse.json({ status: "error", message: "URL 미설정" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "error", message: String(error) }, { status: 500 });
  }
}
