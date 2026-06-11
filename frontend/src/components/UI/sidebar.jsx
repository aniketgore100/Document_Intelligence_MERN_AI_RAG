import {
  Building2,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  BookOpen,
  User,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../../constants/roles";

const userMenuItems = [
  { name: "Knowledge Base", icon: BookOpen, path: "/home" },
  { name: "Profile", icon: User, path: "/profile" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const orgAdminMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/home" },
  { name: "Documents", icon: FileText, path: "/documents" },
  { name: "Departments", icon: Building2, path: "/departments" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const globalAdminMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/home" },
  { name: "Settings", icon: Settings },
];

const deptAdminMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/home" },
  { name: "Members", icon: Users, path: "/department/users" },
  { name: "Documents", icon: FileText, path: "/documents" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const isMenuItemActive = (pathname, path) => {
  if (!path) return false;
  if (path === "/departments") {
    return pathname === path || pathname.startsWith("/department/");
  }
  return pathname === path;
};

const Sidebar = ({ isCollapsed, onToggle, roleName, isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems =
    roleName === ROLES.USER
      ? userMenuItems
      : roleName === ROLES.GLOBAL_ADMIN
      ? globalAdminMenuItems
      : roleName === ROLES.DEPT_ADMIN
        ? deptAdminMenuItems
        : orgAdminMenuItems;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-slate-300/70 bg-slate-100/80 backdrop-blur-md transition-all duration-300 dark:border-slate-700/70 dark:bg-slate-900/55 ${
        isCollapsed ? "w-16" : "w-52"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:sticky md:translate-x-0`}
    >
      <div className={`border-b border-slate-300/70 py-3 dark:border-slate-700/70 ${isCollapsed ? "px-2" : "px-3"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Document Intelligence
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-slate-200 bg-white/70 p-1.5 text-slate-500 transition duration-200 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
      </div>

      <div className={`flex flex-1 flex-col py-7 ${isCollapsed ? "items-center gap-5 px-2" : "gap-8 px-6"}`}>
        {!isCollapsed ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
            Administration
          </p>
        ) : null}

        <div className={`flex w-full flex-col ${isCollapsed ? "items-center gap-4" : "gap-6"}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isMenuItemActive(location.pathname, item.path);

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                if (item.path) navigate(item.path);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`group flex cursor-pointer items-center rounded-xl bg-transparent text-left transition-colors duration-200 ${
                isCollapsed ? "justify-center p-2" : "gap-4 py-1"
              } ${
                isActive
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                size={isCollapsed ? 17 : 19}
                strokeWidth={2.4}
                className="shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              {!isCollapsed && (
                <span className="text-xs font-bold tracking-[0.05em]">
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
        </div>
      </div>

      <div className={`border-t border-slate-300/70 py-3 dark:border-slate-700/70 ${isCollapsed ? "px-2 text-center" : "px-3"}`}>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">© 2026 Document Intelligence</p>
      </div>
    </aside>
  );
};

export default Sidebar;
