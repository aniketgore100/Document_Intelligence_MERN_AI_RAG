import { ChevronRight, Home, Layers3, Plus, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { formatRoleName } from "../../utils/formatRoleName";

const toTitle = (segment) =>
  segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const Navbar = ({ user }) => {
  const location = useLocation();
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const segments = location.pathname.split("/").filter(Boolean);
  const isRolesPage = location.pathname === "/roles";

  const defaultCrumbs = segments.map((seg, idx) => {
    const path = `/${segments.slice(0, idx + 1).join("/")}`;
    return {
      label: toTitle(seg),
      path,
      isLast: idx === segments.length - 1,
    };
  });

  const pageName = defaultCrumbs.length ? defaultCrumbs[defaultCrumbs.length - 1].label : "Workspace";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/50 bg-transparent px-2 py-2 md:px-3 dark:border-slate-700/40">
      {isRolesPage ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">
                Role and Permission Management
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Define, review, and maintain role-based access controls across your workspace.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />

              <div className="group relative flex items-center gap-2 px-1 py-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="hidden pr-1 md:block">
                  <p className="text-sm font-medium leading-none text-slate-800 dark:text-slate-100">{user?.name}</p>
                  <p className="mt-0.5 text-xs muted">{formatRoleName(user?.roleName) || "User"}</p>
                </div>

                <div className="surface absolute right-0 top-10 hidden min-w-56 rounded-xl px-3 py-2 group-hover:block">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs muted">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />

          <div className="flex items-center justify-between gap-3 pr-1 md:pr-3">
            <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
              <Link
                to="/home"
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Home size={13} />
                <span>Home</span>
              </Link>


              <ChevronRight size={12} className="text-slate-400" />

              <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                <ShieldCheck size={13} />
                <span>Roles & Permissions</span>
              </span>
            </nav>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-create-role"))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              <Plus size={13} />
              Create Role
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-medium text-slate-800 dark:text-slate-100">{pageName}</h1>

            <div className="mt-0.5 flex items-center gap-1 text-xs">
              {defaultCrumbs.length === 0 ? (
                <span className="text-slate-500 dark:text-slate-400">Home</span>
              ) : (
                defaultCrumbs.map((crumb) => (
                  <div key={crumb.path} className="flex items-center gap-1">
                    {!crumb.isLast ? (
                      <Link to={crumb.path} className="text-blue-700 hover:underline dark:text-blue-300">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-300">{crumb.label}</span>
                    )}
                    {!crumb.isLast && <ChevronRight size={12} className="text-slate-400" />}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            <div className="group relative flex items-center gap-2 px-1 py-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
                {initials}
              </div>
              <div className="hidden pr-1 md:block">
                <p className="text-sm font-medium leading-none text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="mt-0.5 text-xs muted">{formatRoleName(user?.roleName) || "User"}</p>
              </div>

              <div className="surface absolute right-0 top-10 hidden min-w-56 rounded-xl px-3 py-2 group-hover:block">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="text-xs muted">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
