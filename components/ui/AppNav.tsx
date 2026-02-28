import Link              from 'next/link';
import { cookies }       from 'next/headers';
import { db }            from '@/lib/db';
import { NavLinks, MobileNavLinks } from './NavLinks';
import { LogoutButton }  from '@/components/auth/LogoutButton';

export async function AppNav() {
  const uid  = cookies().get('cosmo_uid')?.value ?? null;
  const user = uid
    ? await db.user.findUnique({ where: { id: uid }, select: { role: true, displayName: true, email: true } })
    : null;

  return (
    <header className="
      fixed top-0 inset-x-0 z-50 h-14
      bg-[#080810]/85 backdrop-blur-md
      border-b border-white/[0.06]
    ">
      <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
        >
          <span className="text-white/70 group-hover:text-white transition-colors text-lg leading-none">
            ✦
          </span>
          <span className="font-semibold text-white/80 group-hover:text-white transition-colors tracking-tight text-sm">
            CosmoSync
          </span>
        </Link>

        {/* Feature nav (desktop) */}
        {user && <NavLinks />}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              {/* Mobile feature links */}
              <MobileNavLinks />

              {/* Profile */}
              <Link
                href="/profile"
                title={user.displayName ?? user.email ?? 'Profile'}
                className="
                  w-7 h-7 rounded-full bg-white/10 border border-white/15
                  flex items-center justify-center
                  text-white/50 hover:text-white/80 hover:border-white/30
                  transition-colors text-xs font-medium
                "
              >
                {(user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </Link>

              {/* Admin badge */}
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="hidden sm:flex px-2 py-0.5 rounded-md text-xs border border-red-400/20 text-red-400/60 hover:border-red-400/40 hover:text-red-400 transition-colors"
                >
                  Admin
                </Link>
              )}

              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white/45 text-sm hover:text-white/80 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="
                  px-3.5 py-1.5 rounded-lg text-sm font-medium
                  border border-white/15 text-white/70
                  hover:border-white/35 hover:text-white
                  transition-colors
                "
              >
                Register
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
