import { useSelector } from "react-redux";
import { useState } from "react";
import Sidebar from "../components/UI/sidebar";
import Navbar from "../components/UI/Navbar";

const Documents = () => {
  const user = useSelector((state) => state.auth.user);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  
  if (!user) return null;

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} />

        <main className="flex-1 overflow-x-auto px-4 py-10">{/* Page Content */}</main>
      </div>
    </div>
  );
};

export default Documents;
