// Sidebar.jsx

import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  ArchiveRestore,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Departments",
    icon: Building2,
  },
  {
    name: "Documents Manage",
    icon: FileText,
  },
  {
    name: "Users",
    icon: Users,
  },
  {
    name: "Retrieve",
    icon: ArchiveRestore,
  },
  {
    name: "Settings",
    icon: Settings,
  },
];

const Sidebar = ({ isCollapsed, onToggle }) => {
  return (
    <aside
      className={`sticky top-0 shrink-0 flex h-screen flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      
      <div className={`border-b border-slate-200 py-4 ${isCollapsed ? "px-2" : "px-4"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Document Intelligence
                </p>
                <p className="text-[11px] text-slate-500">Workspace</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className={`flex flex-1 flex-col gap-2 py-5 ${isCollapsed ? "px-2" : "px-3"}`}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={index}
              className={`group flex items-center rounded-xl py-3 text-sm font-medium text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 ${
                isCollapsed ? "justify-center px-2" : "gap-3 px-4"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                size={20}
                className="transition-all group-hover:scale-110"
              />

              {!isCollapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`border-t border-slate-200 py-4 ${isCollapsed ? "px-2 text-center" : "px-4"}`}>
        <p className="text-xs text-slate-400">© 2026 Document Intelligence</p>
      </div>
    </aside>
  );
};

export default Sidebar;
