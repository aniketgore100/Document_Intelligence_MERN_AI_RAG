import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAcceptOrganizationInviteMutation, useValidateInviteQueryArg, useValidateOrganizationInviteQuery } from "../features/invites/invitesApiSlice";
import { formatRoleName } from "../utils/formatRoleName";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const validateArg = useValidateInviteQueryArg(token);
  const { data, isLoading, isError, error } = useValidateOrganizationInviteQuery(validateArg);
  const [acceptInvite, { isLoading: isSubmitting }] = useAcceptOrganizationInviteMutation();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const invite = useMemo(() => data?.invite || null, [data]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!token) {
      setFormError("Invite token is missing.");
      return;
    }
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    try {
      await acceptInvite({
        token,
        name: name.trim(),
        password,
      }).unwrap();
      setAccepted(true);
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to accept invite.");
    }
  };

  if (!token) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Invalid Invite</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invite link is missing a token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Accept Organization Invite</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete your account setup to access the organization.
        </p>

        {isLoading ? <p className="mt-5 text-sm">Validating invite...</p> : null}

        {isError ? (
          <p className="mt-5 text-sm text-red-600">{error?.data?.message || "Invite is invalid or expired."}</p>
        ) : null}

        {!isLoading && !isError && invite ? (
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Organization</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{invite.organization?.name || "-"}</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{formatRoleName(invite.roleName)}</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{invite.email}</p>
            </div>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
            />

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            {accepted ? <p className="text-sm text-green-600">Account created. Redirecting to login...</p> : null}

            <button
              type="submit"
              disabled={isSubmitting || accepted}
              className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default AcceptInvite;
