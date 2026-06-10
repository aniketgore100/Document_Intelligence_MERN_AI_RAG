import { ArrowRight, Building2, FileText, Layers3, Sparkles, Users } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useGetOrgAdminSummaryQuery } from "../features/dashboard/dashboardApiSlice";

const formatCount = (value) => new Intl.NumberFormat("en-US").format(value || 0);

const OrgAdminDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const { data, isLoading, isError } = useGetOrgAdminSummaryQuery();

  const workspaceName = data?.organization?.name || user?.organizationName || "Organization";

  const cards = useMemo(
    () => [
      {
        title: "Departments",
        value: formatCount(data?.totals?.departments),
        helper: "Real count from the backend",
        icon: Layers3,
        accent: "from-blue-500 to-indigo-600",
      },
      {
        title: "Documents",
        value: formatCount(data?.totals?.documents),
        helper: "Real count from the backend",
        icon: FileText,
        accent: "from-emerald-500 to-teal-600",
      },
      {
        title: "Active Members",
        value: "24",
        helper: "Frontend placeholder",
        icon: Users,
        accent: "from-violet-500 to-fuchsia-600",
      },
      {
        title: "Open Tasks",
        value: "7",
        helper: "Frontend placeholder",
        icon: Sparkles,
        accent: "from-amber-500 to-orange-600",
      },
    ],
    [data]
  );

  const quickActions = [
    {
      label: "Manage Departments",
      description: "Review members and invites.",
      to: "/departments",
      icon: Building2,
    },
    {
      label: "Open Documents",
      description: "Upload, list, and manage files.",
      to: "/documents",
      icon: FileText,
    },
  ];

  const activityFeed = [
    {
      title: "Department invite sent",
      meta: "5 minutes ago",
      tone: "text-emerald-700 dark:text-emerald-300",
    },
    {
      title: "Document archived",
      meta: "42 minutes ago",
      tone: "text-slate-600 dark:text-slate-300",
    },
    {
      title: "Permission update saved",
      meta: "2 hours ago",
      tone: "text-slate-600 dark:text-slate-300",
    },
  ];

  return (
    <section className="space-y-4 p-1">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Organization Admin Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {workspaceName}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A compact overview of the workspace with real document and department totals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              <Layers3 size={12} />
              {isLoading ? "Loading counts..." : `${formatCount(data?.totals?.departments)} departments`}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <FileText size={12} />
              {isLoading ? "Loading counts..." : `${formatCount(data?.totals?.documents)} documents`}
            </span>
          </div>
        </div>

        {isError ? (
          <div className="px-4 py-4 text-sm text-red-600">
            Failed to load dashboard data.
          </div>
        ) : null}

        <div className="grid gap-3 p-4 xl:grid-cols-12">
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-8">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {card.title}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                        {isLoading && card.title !== "Active Members" && card.title !== "Open Tasks"
                          ? "—"
                          : card.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {card.helper}
                      </p>
                    </div>

                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}>
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 xl:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Quick Actions
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Jump straight to common tasks
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.to}
                      to={action.to}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            <Icon size={15} />
                          </span>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {action.label}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Recent Activity
              </p>
              <div className="mt-4 space-y-3">
                {activityFeed.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      <p className={`text-xs ${item.tone}`}>
                        {item.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrgAdminDashboard;
