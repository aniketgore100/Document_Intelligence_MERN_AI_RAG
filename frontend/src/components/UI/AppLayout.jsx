import { useState } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./sidebar";

const AppLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        roleName={user.roleName}
      />

      <div className="flex min-w-0 flex-1 flex-col px-2 py-2">
        <Navbar user={user} />
        <main className="mt-2 flex-1 overflow-x-auto rounded-xl border bg-transparent p-1.5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
