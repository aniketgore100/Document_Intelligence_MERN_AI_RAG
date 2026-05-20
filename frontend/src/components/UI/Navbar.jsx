const Navbar = ({ user }) => {

  console.log("user :: ", user);
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-end border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="group relative flex cursor-pointer items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white font-semibold">
          {initials}
        </div>
        <div className="absolute right-0 top-12 hidden min-w-48 flex-col rounded-lg bg-white px-4 py-2 shadow-lg group-hover:flex">
          <span className="text-sm font-medium text-slate-800">{user?.name}</span>
          <span className="text-xs text-slate-500">{user?.email}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
