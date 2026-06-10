import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware - actual auth check is done in the admin layout server component
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
