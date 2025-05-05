import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// This API route allows manual revalidation of paths
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "/";

  // Revalidate the specific path
  revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    now: Date.now(),
    path,
  });
}
