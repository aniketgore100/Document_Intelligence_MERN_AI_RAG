import { useSelector } from "react-redux";
import { formatRoleName } from "../utils/formatRoleName";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <section className="p-1">
      <div className="rounded-xl border bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profile</p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] muted">Name</p>
            <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{user?.name || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] muted">Email</p>
            <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{user?.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] muted">Role</p>
            <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
              {formatRoleName(user?.roleName) || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] muted">Department</p>
            <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
              {user?.departmentName || "-"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
