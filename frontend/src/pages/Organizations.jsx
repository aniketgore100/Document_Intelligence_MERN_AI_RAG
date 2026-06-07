import { Building2, CircleAlert, User } from "lucide-react";
import { useGetOrganizationByIdQuery } from "../features/organizations/organizationsApiSlice";
import { useParams } from "react-router-dom";

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const InfoRow = ({ label, value }) => (
  <div className="space-y-0.5">
    <p className="text-xs uppercase tracking-wide muted">{label}</p>
    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">
      {value || "-"}
    </p>
  </div>
);

const StatCard = ({ title, value }) => (
  <div className="surface rounded-xl p-3">
    <p className="text-xs muted">{title}</p>
    <p className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
      {value}
    </p>
  </div>
);

const Organizations = () => {
  const params = useParams();

  const { data, error, isLoading } = useGetOrganizationByIdQuery({
    id: params.id,
    slug: params.slug,
  });

  const organization = data?.organization || null;
  const owner = organization?.Owner || null;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="surface rounded-xl p-4 text-sm muted">
          Loading organization details...
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-4">
        <div className="surface flex items-start gap-3 rounded-xl p-4">
          <CircleAlert className="mt-0.5 text-red-500" size={18} />

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Unable to load organization
            </p>

            <p className="text-sm muted">
              {error?.data?.message ||
                "Organization details are unavailable right now."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard title="Members" value="0" />
        <StatCard title="Departments" value="0" />
        <StatCard title="Documents" value="0" />
      </div>

      {/* Details */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Organization */}
        <div className="surface rounded-2xl p-4">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={16} />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              Organization Details
            </h2>
          </div>

          <div className="space-y-4">
            <InfoRow label="Name" value={organization.name} />
            <InfoRow label="Slug" value={organization.slug} />
            <InfoRow label="Status" value={organization.status} />
            <InfoRow
              label="Admin Email"
              value={organization?.metadata?.orgAdminEmail}
            />
            <InfoRow
              label="Created On"
              value={formatDate(organization.createdAt)}
            />
          </div>
        </div>

        {/* Owner */}
        <div className="surface rounded-2xl p-4">
          <div className="mb-4 flex items-center gap-2">
            <User size={16} />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              Owner Details
            </h2>
          </div>

          <div className="space-y-4">
            <InfoRow label="Name" value={owner?.name} />
            <InfoRow label="Email" value={owner?.email} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Organizations;
