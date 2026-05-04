import { useSelector } from "react-redux";

const Documents = () => {
  const user = useSelector((state) => state.auth.user);

  if (!user) return null;

  const initials = user.name?.split(" ").map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-2xl font-semibold text-slate-800">Documents</h1>

        {/* Profile Badge */}
        <div className="flex items-center gap-3 cursor-pointer group">
          
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white font-semibold">
            {initials}
          </div>

          {/* Name + Email (hover reveal optional) */}
          <div className="hidden flex-col group-hover:flex absolute right-6 top-16 bg-white shadow-lg rounded-lg px-4 py-2">
            <span className="text-sm font-medium text-slate-800">
              {user.name}
            </span>
            <span className="text-xs text-slate-500">
              {user.email}
            </span>
          </div>

        </div>
      </div>

      {/* Page Content */}
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Your main content */}
      </div>
    </div>
  );
};

export default Documents;