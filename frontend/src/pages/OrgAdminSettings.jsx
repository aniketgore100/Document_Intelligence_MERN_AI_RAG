import { Check, Loader2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useUpdateMeMutation } from "../features/auth/authApiSlice";
import { formatRoleName } from "../utils/formatRoleName";

const OrgAdminSettings = () => {
  const user = useSelector((state) => state.auth.user);
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await updateMe({ name }).unwrap();
      setMessage("Name updated successfully.");
    } catch (err) {
      setError(err?.data?.message || "Failed to update name.");
    }
  };

  const trimmedName = name.trim();
  const isUnchanged = trimmedName === (user?.name || "");
  const isInvalid = trimmedName.length < 2 || trimmedName.length > 60;

  return (
    <section className="min-h-[58vh] p-1">
      <div className="max-w-xl rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <UserRound size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account Settings</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update the name shown across the workspace.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/30">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Current Account
          </p>
          <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 dark:text-slate-300">
            <p>
              <span className="font-medium text-slate-900 dark:text-slate-100">Email:</span> {user?.email || "-"}
            </p>
            <p>
              <span className="font-medium text-slate-900 dark:text-slate-100">Role:</span>{" "}
              {formatRoleName(user?.roleName) || "-"}
            </p>
          </div>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Display Name</span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setMessage("");
                setError("");
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
              placeholder="Enter your name"
              maxLength={60}
            />
          </label>

          {error ? <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
          {message ? <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">{message}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || isInvalid || isUnchanged}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save Name
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default OrgAdminSettings;
