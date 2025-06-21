import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export enum DefaultRole {
  SUPER_ADMIN = 'super_admin',
  ADMINISTRATOR = 'administrator',
  USER = 'user',
}

// Interface for the role verification API response
interface VerifyRoleResponse {
  role?: {
    name: string;
  };
}

// Interface for the auth check API response
interface AuthCheckResponse {
  message: string;
  user: {
    uid: string;
    email?: string;
  };
  isLogin: boolean;
}

// Interface for the lecture access check API response
interface VerifyLectureAccessResponse {
  hasAccess: boolean;
  isPreviewable: boolean;
  lecture?: {
    id: string;
    name: string;
  };
  course?: {
    id: string;
    title: string;
    progress: number;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth_token')?.value;
  const unauthorizedUrl = new URL('/unauthorized', request.url);
  const unaccessibleUrl = new URL('/unaccessible', request.url);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- Admin Route Check ---
  if (pathname.startsWith('/admin')) {
    console.log('Middleware: Checking admin route:', pathname);
    const backendVerifyRoleUrl = `${apiBaseUrl}/role/user-role-and-permission`;

    // Early return if no token
    if (!token) {
      console.log('Middleware (Admin): No token found, redirecting to login.');
      return NextResponse.redirect(unauthorizedUrl);
    }

    try {
      const response = await fetch(backendVerifyRoleUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Early return if backend verification fails
      if (!response.ok) {
        console.error(`Middleware (Admin): Backend role verification failed with status ${response.status}`);
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token'); // Clear potentially invalid cookie
        return responseRedirect;
      }

      const verificationData = (await response.json()) as VerifyRoleResponse;
      const roleName = verificationData.role?.name?.toLowerCase();

      // Early return if role is unauthorized for admin section
      if (!roleName || (roleName !== DefaultRole.ADMINISTRATOR && roleName !== DefaultRole.SUPER_ADMIN)) {
        console.log(`Middleware (Admin): Role '${roleName || 'none'}' is unauthorized for admin access, redirecting.`);
        return NextResponse.redirect(unauthorizedUrl);
      }

      // Role is valid and authorized for admin
      console.log(`Middleware (Admin): Role '${roleName}' authorized.`);
      return NextResponse.next(); // Allow access

    } catch (error) {
      console.error('Error in admin middleware during backend verification:', error);
      const responseRedirect = NextResponse.redirect(unauthorizedUrl);
      responseRedirect.cookies.delete('auth_token'); // Clear potentially invalid cookie on error
      return responseRedirect;
    }
  }

  // --- Owner Route Check ---
  if (pathname.startsWith('/owner')) {
    console.log('Middleware: Checking owner route:', pathname);
    
    if (!token) {
      console.log('Middleware (Owner): No token found, redirecting to login.');
      return NextResponse.redirect(unauthorizedUrl);
    }

    try {
      const checkResponse = await fetch(`${apiBaseUrl}/auth/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!checkResponse.ok) {
        console.error(`Middleware (Owner): Auth check failed with status ${checkResponse.status}`);
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token');
        return responseRedirect;
      }

      const authData = (await checkResponse.json()) as AuthCheckResponse;
      
      if (!authData.isLogin || !authData.user) {
        console.log('Middleware (Owner): User not authenticated, redirecting to login.');
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token');
        return responseRedirect;
      }

      console.log('Middleware (Owner): User authenticated successfully.');
      return NextResponse.next();

    } catch (error) {
      console.error('Error in owner middleware during auth check:', error);
      const responseRedirect = NextResponse.redirect(unauthorizedUrl);
      responseRedirect.cookies.delete('auth_token');
      return responseRedirect;
    }
  }

  // --- GCS API Routes Check ---
  if (pathname.startsWith('/api/gcs-delete') || pathname.startsWith('/api/gcs-upload')) {
    try {
      if (!token) {
        console.log('Middleware (GCS): No token found, returning unauthorized.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check auth for GCS API routes
      const checkResponse = await fetch(`${apiBaseUrl}/auth/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!checkResponse.ok) {
        console.error(`Middleware (GCS): Auth check failed with status ${checkResponse.status}`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const authData = (await checkResponse.json()) as AuthCheckResponse;
      
      if (!authData.isLogin || !authData.user) {
        console.log('Middleware (GCS): User not authenticated.');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.next(); // Allow access to GCS API routes

    } catch (error) {
      console.error('Error in GCS API middleware during auth check:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  // --- Profile and Order Routes Check ---
  if (pathname.startsWith('/profile') || pathname.startsWith('/order') ) {
    console.log('Middleware: Checking user route:', pathname);
    
    try {
      if (!token) {
        console.log('Middleware (User): No token found, redirecting to login.');
        return NextResponse.redirect(unauthorizedUrl);
      }

      const checkResponse = await fetch(`${apiBaseUrl}/auth/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!checkResponse.ok) {
        console.error(`Middleware (User): Auth check failed with status ${checkResponse.status}`);
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token');
        return responseRedirect;
      }

      const authData = (await checkResponse.json()) as AuthCheckResponse;
      
      if (!authData.isLogin || !authData.user) {
        console.log('Middleware (User): User not authenticated, redirecting to login.');
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token');
        return responseRedirect;
      }

      console.log('Middleware (User): User authenticated successfully.');
      return NextResponse.next();

    } catch (error) {
      console.error('Error in user middleware during auth check:', error);
      const responseRedirect = NextResponse.redirect(unauthorizedUrl);
      responseRedirect.cookies.delete('auth_token');
      return responseRedirect;
    }
  }

  // --- Lecture Route Access Check ---
  // Check if path looks like /courses/{id}/lectures/{slug}
  const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
  const isLectureRoute =
    pathSegments.length === 4 &&
    pathSegments[0] === 'courses' &&
    pathSegments[2] === 'lectures';

  if (isLectureRoute) {
    const lectureSlug = pathSegments[3];
    console.log(`Middleware: Checking lecture access for slug: ${lectureSlug}`);
    const backendVerifyLectureAccessUrl = `${apiBaseUrl}/user-course/check-access/lecture/${lectureSlug}`;

    // Early return if no token for lecture route
    if (!token) {
      console.log('Middleware (Lecture): No token found, redirecting to login.');
      return NextResponse.redirect(unauthorizedUrl);
    }

    try {
      // First check if user is authenticated
      const authCheckResponse = await fetch(`${apiBaseUrl}/auth/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!authCheckResponse.ok) {
        console.error(`Middleware (Lecture): Auth check failed with status ${authCheckResponse.status}`);
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token');
        return responseRedirect;
      }

      const authData = (await authCheckResponse.json()) as AuthCheckResponse;
      
      if (!authData.isLogin || !authData.user) {
        console.log('Middleware (Lecture): User not authenticated, redirecting to login.');
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token');
        return responseRedirect;
      }

      // Then check lecture access
      const response = await fetch(backendVerifyLectureAccessUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Middleware (Lecture): Backend access check failed with status ${response.status}`);
        return NextResponse.redirect(unaccessibleUrl);
      }

      const accessData = (await response.json()) as VerifyLectureAccessResponse;

      if (!accessData.hasAccess) {
        console.log(`Middleware (Lecture): User does not have access to lecture slug: ${lectureSlug}. Redirecting.`);
        return NextResponse.redirect(unaccessibleUrl);
      }

      console.log(`Middleware (Lecture): User has access to lecture slug: ${lectureSlug}.`);
      return NextResponse.next();

    } catch (error) {
      console.error('Error in lecture access middleware during backend verification:', error);
      return NextResponse.redirect(unaccessibleUrl);
    }
  }

  // --- Default: Allow other routes ---
  return NextResponse.next();
}

// Updated matcher to include owner routes and other protected routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - except /api/gcs-* which we want to protect)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/login (login page)
     * - auth/register (register page)
     * - auth/forgot-password (forgot password page)
     * - auth/reset-password (reset password page)
     * - unauthorized (unauthorized page)
     * - unaccessible (unaccessible page)
     * - assets (public assets folder)
     * - images (public images folder)
     * - sounds (public sounds folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/login|auth/register|auth/forgot-password|auth/reset-password|unauthorized|unaccessible|assets|images|sounds).*)',
    // Specifically include GCS API routes
    '/api/gcs-upload/:path*',
    '/api/gcs-delete/:path*',
  ],
};