import {
  Building2,
  FileText,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "../../constants/roles";

const orgAdminMenuItems = [
  { name: "Home", icon: Home, path: "/home" },
  { name: "Departments", icon: Building2, path: "/departments" },
  { name: "Documents", icon: FileText, path: "/documents" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const globalAdminMenuItems = [
  { name: "Home", icon: Home, path: "/home" },
  { name: "Role Management", icon: ShieldCheck, path: "/roles" },
  { name: "Settings", icon: Settings },
];

const deptAdminMenuItems = [
  { name: "Home", icon: Home, path: "/home" },
  { name: "Documents", icon: FileText, path: "/documents" },
  { name: "Manage Users", icon: Users, path: "/department/users" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const Sidebar = ({ isCollapsed, onToggle, roleName, isMobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems =
    roleName === ROLES.GLOBAL_ADMIN
      ? globalAdminMenuItems
      : roleName === ROLES.DEPT_ADMIN
        ? deptAdminMenuItems
        : orgAdminMenuItems;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-slate-300/70 bg-slate-100/75 backdrop-blur-md transition-all duration-300 dark:border-slate-700/70 dark:bg-slate-900/55 ${
        isCollapsed ? "w-20" : "w-64"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} md:sticky md:translate-x-0`}
    >
      <div className={`border-b py-3 ${isCollapsed ? "px-2" : "px-3"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] muted">Document Intelligence</p>
                <p className="text-[10px] muted">AI Workspace</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border bg-white/80 p-1.5 transition duration-200 hover:scale-[1.03] hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
      </div>

      <div className={`flex flex-1 flex-col gap-1.5 py-3 ${isCollapsed ? "px-2" : "px-2.5"}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path && location.pathname === item.path;

          return (
            <button
              key={item.name}
              type="button"
            onClick={() => {
              if (item.path) navigate(item.path);
              if (onCloseMobile) onCloseMobile();
            }}
              className={`group flex cursor-pointer items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
                isCollapsed ? "justify-center px-2" : "gap-2.5 px-3"
              } ${
                isActive
                  ? "-translate-y-[1px] bg-blue-100 text-blue-700 ring-1 ring-blue-200/80 dark:bg-blue-900/35 dark:text-blue-300 dark:ring-blue-700/60"
                  : "text-slate-700 hover:-translate-y-[1px] hover:bg-white/80 hover:text-slate-900 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-800/70"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon size={17} className="transition-transform duration-200 group-hover:scale-110" />
              {!isCollapsed && <span className="font-medium text-slate-800 dark:text-slate-100">{item.name}</span>}
            </button>
          );
        })}
      </div>

      <div className={`border-t py-3 ${isCollapsed ? "px-2 text-center" : "px-3"}`}>
        <p className="text-[11px] muted">© 2026 Document Intelligence</p>
      </div>
    </aside>
  );
};

export default Sidebar;
