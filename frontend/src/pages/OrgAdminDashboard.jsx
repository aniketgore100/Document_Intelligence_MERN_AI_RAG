import {
  FilePlus2,
  FileText,
  Layers3,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGetOrgAdminSummaryQuery } from "../features/dashboard/dashboardApiSlice";

const formatCount = (value) => new Intl.NumberFormat("en-US").format(value || 0);
const totalSeries = (rows = []) => rows.reduce((sum, item) => sum + (item.count || 0), 0);
const RANGE_OPTIONS = [7, 14, 30];

const OrgAdminDashboard = () => {
  const [rangeDays, setRangeDays] = useState(7);
  const { data, isLoading, isFetching, isError } = useGetOrgAdminSummaryQuery({
    days: rangeDays,
  });

  const cards = useMemo(
    () => [
      {
        title: "Documents",
        value: formatCount(data?.totals?.documents),
        helper: "Across organization",
        icon: FileText,
      },
      {
        title: "Members",
        value: formatCount(data?.totals?.members),
        helper: "Active department users",
        icon: Users,
      },
      {
        title: "Departments",
        value: formatCount(data?.totals?.departments),
        helper: "Available departments",
        icon: Layers3,
      },
      {
        title: "Daily Users",
        value: formatCount(totalSeries(data?.daily?.usersAdded)),
        helper: `Added in last ${rangeDays} days`,
        icon: UserPlus,
      },
      {
        title: "Daily Docs",
        value: formatCount(totalSeries(data?.daily?.documentsAdded)),
        helper: `Assigned in last ${rangeDays} days`,
        icon: FilePlus2,
      },
    ],
    [data, rangeDays]
  );

  const dailyRows = useMemo(
    () =>
      (data?.daily?.usersAdded || [])
        .map((item, index) => ({
          ...item,
          documentCount: data?.daily?.documentsAdded?.[index]?.count || 0,
        }))
        .reverse(),
    [data]
  );

  const maxDailyCount = Math.max(
    1,
    ...dailyRows.map((item) => Math.max(item.count, item.documentCount))
  );

  return (
    <section className="relative space-y-5 px-3 pt-0 pb-3 md:px-6 md:pt-0 md:pb-6">
      <div className="space-y-5">
        {isError ? (
          <div className="px-4 py-4 text-sm text-red-600">
            Failed to load dashboard data.
          </div>
        ) : null}

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="mx-auto w-full max-w-[14.25rem] rounded-2xl border border-slate-300 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex shrink-0 items-center justify-center text-blue-700 dark:text-blue-300">
                      <Icon size={20} strokeWidth={2.4} />
                    </span>
                    <p className="text-xs font-bold tracking-[0.05em] text-slate-600 dark:text-slate-300">
                      {card.title}
                    </p>
                  </div>
                  <p className="mt-6 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                    {isLoading ? "-" : card.value}
                  </p>
                  <p className="mt-2 truncate text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {card.helper}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h2 className="text-sm font-bold tracking-[0.05em] text-slate-950 dark:text-slate-100">
                    Daily Additions
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Latest data appears first{isFetching ? " - updating..." : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <i className="h-3 w-3 rounded-full bg-blue-600" />
                      Users
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <i className="h-3 w-3 rounded-full bg-indigo-100" />
                      Documents
                    </span>
                  </div>
                  <div className="flex rounded-full bg-slate-200 p-1 dark:bg-slate-800">
                    {RANGE_OPTIONS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setRangeDays(days)}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                          rangeDays === days
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                        }`}
                      >
                        {days}D
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative h-[330px] overflow-x-auto">
                <div className="absolute inset-x-0 top-8 border-t border-slate-200 dark:border-slate-800" />
                <div className="absolute inset-x-0 top-[112px] border-t border-slate-200 dark:border-slate-800" />
                <div className="absolute inset-x-0 top-[196px] border-t border-slate-200 dark:border-slate-800" />
                <div className="absolute inset-x-0 bottom-10 border-t border-slate-300 dark:border-slate-700" />
              <div className="relative flex h-full min-w-[720px] items-end gap-8 px-10">
                {dailyRows.map((item) => {
                  const userHeight = item.count
                    ? Math.max(10, Math.round((item.count / maxDailyCount) * 220))
                    : 8;
                  const documentHeight = item.documentCount
                    ? Math.max(10, Math.round((item.documentCount / maxDailyCount) * 220))
                    : 8;
                  const label = new Date(item.date).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <div
                      key={item.date}
                      className="group relative flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-3"
                    >
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block dark:bg-slate-100 dark:text-slate-900">
                        {label}: {item.count} users, {item.documentCount} docs
                      </div>
                      <div className="flex h-[220px] items-end gap-2">
                        <div
                          title={`${label}: ${item.count} users`}
                          className="w-3.5 rounded-t bg-blue-600 transition group-hover:bg-blue-500"
                          style={{ height: userHeight }}
                        />
                        <div
                          title={`${label}: ${item.documentCount} documents`}
                          className="w-3.5 rounded-t bg-indigo-100 transition group-hover:bg-indigo-200 dark:bg-blue-900/50 dark:group-hover:bg-blue-800/70"
                          style={{ height: documentHeight }}
                        />
                      </div>
                      <span className="truncate text-xs font-bold text-slate-600 dark:text-slate-400">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="fixed bottom-8 right-8 z-20 grid h-14 w-14 place-items-center rounded-xl bg-blue-600 text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-500"
        aria-label="Add"
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>
    </section>
  );
};

export default OrgAdminDashboard;
