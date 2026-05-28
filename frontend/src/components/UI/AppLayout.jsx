import { useState } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./sidebar";

const AppLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-transparent">
      {isMobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        roleName={user.roleName}
      />

      <div className="flex min-w-0 flex-1 flex-col px-1.5 py-1.5 sm:px-2 sm:py-2">
        <Navbar user={user} onMenuToggle={() => setIsMobileSidebarOpen((prev) => !prev)} />
        <main className="mt-2 flex-1 overflow-x-auto rounded-xl border bg-transparent p-1.5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
