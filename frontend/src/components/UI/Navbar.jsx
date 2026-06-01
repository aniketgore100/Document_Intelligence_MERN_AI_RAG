import { ChevronRight, Home, Layers3, Menu, Plus, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import ThemeToggle from "./ThemeToggle";
import { formatRoleName } from "../../utils/formatRoleName";
import { ROLES } from "../../constants/roles";
import { useGetOrganizationsQuery } from "../../features/organizations/organizationsApiSlice";

const toTitle = (segment) => segment.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const isObjectId = (str) => /^[a-f\d]{24}$/i.test(str);

const toPathBreadcrumbs = (pathname) => {
  const segments = pathname.split("/").filter(Boolean);
  const filteredSegments = isObjectId(segments[segments.length - 1])? segments.slice(0, -1): segments;

  return filteredSegments.map((seg, idx) => ({
    label: toTitle(seg),
    path: `/${filteredSegments.slice(0, idx + 1).join("/")}`,
    isLast: idx === filteredSegments.length - 1,
  }));
  
};

const getHomeHeading = (roleName) => {
  if (roleName === ROLES.GLOBAL_ADMIN) return "Global Admin Dashboard";
  if (roleName === ROLES.ORG_ADMIN) return "Organization Admin Dashboard";
  if (roleName === ROLES.DEPT_ADMIN) return "Department Admin Dashboard";
  return "User Dashboard";
};

const resolveDepartmentName = (user) =>
  user?.departmentName ||
  user?.department?.name ||
  user?.membership?.departmentName ||
  user?.membership?.department?.name ||
  "Department Dashboard";

const UserBadge = ({ user, initials }) => (
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
);

const Navbar = ({ user, onMenuToggle }) => {
  const location = useLocation();
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const isRolesPage = location.pathname === "/roles";
  const isGlobalAdminHome = location.pathname === "/home" && user?.roleName === ROLES.GLOBAL_ADMIN;
  const isOrgAdminHome = location.pathname === "/home" && user?.roleName === ROLES.ORG_ADMIN;
  const isOrgAdminDepartments = location.pathname === "/departments" && user?.roleName === ROLES.ORG_ADMIN;
  const isDeptAdminHome = location.pathname === "/home" && user?.roleName === ROLES.DEPT_ADMIN;

  const departmentDisplayName = resolveDepartmentName(user);

  const orgListQueryArg = isOrgAdminHome ? { page: 1, limit: 100 } : skipToken;
  const { data: orgData } = useGetOrganizationsQuery(orgListQueryArg);

  const orgAdminOrganizationName =
    orgData?.organizations?.find((org) => {
      const ownerId = typeof org?.Owner === "object" ? org.Owner?._id : org?.Owner;
      return String(ownerId || "") === String(user?.id || "");
    })?.name ||
    orgData?.organizations?.[0]?.name ||
    "Organization Dashboard";

  const defaultCrumbs = toPathBreadcrumbs(location.pathname);
  const isHomePage = location.pathname === "/home";
  const pageName = isHomePage
    ? getHomeHeading(user?.roleName)
    : defaultCrumbs.length
      ? defaultCrumbs[defaultCrumbs.length - 1].label
      : "Workspace";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/50 bg-transparent px-2 py-2 md:px-3 dark:border-slate-700/40">
      <div className="mb-2 md:hidden">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex items-center rounded-md border bg-white/80 p-1.5 dark:bg-slate-900/50"
          aria-label="Open sidebar menu"
        >
          <Menu size={16} />
        </button>
      </div>

      {isRolesPage ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">Role and Permission Management</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Define, review, and maintain role-based access controls across your workspace.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <UserBadge user={user} initials={initials} />
            </div>
          </div>

          <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />

          <div className="flex items-center justify-between gap-3 pr-1 md:pr-3">
            <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
              <Link to="/home" className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
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
      ) : isGlobalAdminHome ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">Global Admin Home</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage organizations and organization admin invitations from here.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <UserBadge user={user} initials={initials} />
            </div>
          </div>

          <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />

          <div className="flex items-center justify-between gap-3 pr-1 md:pr-3">
            <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
              <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                <Home size={13} />
                <span>Home</span>
              </span>
            </nav>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-create-organization"))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
            >
              <Plus size={13} />
              Create Organization
            </button>
          </div>
        </div>
      ) : isOrgAdminHome ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">{orgAdminOrganizationName}</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage your organization workspace from here.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <UserBadge user={user} initials={initials} />
            </div>
          </div>

          <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />

          <div className="flex items-center justify-between gap-3 pr-1 md:pr-3">
            <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
              <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-500 dark:text-slate-400">
                <Home size={13} />
                <span>Home</span>
              </span>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                <Layers3 size={13} />
                <span>{orgAdminOrganizationName}</span>
              </span>
            </nav>

          </div>
        </div>
      ) : isDeptAdminHome ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">{departmentDisplayName}</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage your department workspace from here.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <UserBadge user={user} initials={initials} />
            </div>
          </div>

          <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />

          <div className="flex items-center justify-between gap-3 pr-1 md:pr-3">
            <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
              <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-500 dark:text-slate-400">
                <Home size={13} />
                <span>Home</span>
              </span>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                <Layers3 size={13} />
                <span>{departmentDisplayName}</span>
              </span>
            </nav>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-medium text-slate-800 dark:text-slate-100">{pageName}</h1>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <UserBadge user={user} initials={initials} />
            </div>
          </div>

          <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />

          <div className="flex items-center justify-between gap-3 pr-1 md:pr-3">
            <nav className="flex items-center gap-1 text-xs" aria-label="Breadcrumb">
              <Link to="/home" className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <Home size={13} />
                <span>Home</span>
              </Link>

              {defaultCrumbs
                .filter((crumb) => crumb.path !== "/home")
                .map((crumb) => (
                  <div key={crumb.path} className="inline-flex items-center gap-1">
                    <ChevronRight size={12} className="text-slate-400" />
                    {crumb.isLast ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-slate-800 dark:text-slate-100">
                        <Layers3 size={13} />
                        <span>{crumb.label}</span>
                      </span>
                    ) : (
                      <Link
                        to={crumb.path}
                        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <span>{crumb.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
            </nav>

            {isOrgAdminDepartments ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-create-department"))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
              >
                <Plus size={13} />
                Create Department
              </button>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
