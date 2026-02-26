import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const isAuthPage = request.nextUrl.pathname.startsWith('/admin/login')
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')

    if (isAdminPage && !isAuthPage && !session) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
