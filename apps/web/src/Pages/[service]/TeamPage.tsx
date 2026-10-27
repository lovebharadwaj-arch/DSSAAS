import {
  Clock3,
  Filter,
  MoreHorizontal,
  ShieldCheck,
  Users,
} from "lucide-react";
import PageHeader from "../../component/dashboard/PageHeader";
import StatCard from "../../component/dashboard/StatCard";

export default function TeamPage() {
  return (
    <>
      <PageHeader
        eyebrow="COLLABORATION"
        title="Team members"
        subtitle="Manage access to your workspace and collaborate securely."
        action="Invite member"
        onAction={() =>
          window.alert("Demo UI: invitations will be connected later.")
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Members"
          value="8"
          change="+2 this month"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Admins"
          value="2"
          change="No change"
          icon={ShieldCheck}
          color="violet"
        />
        <StatCard
          label="Pending invites"
          value="1"
          change="Awaiting response"
          icon={Clock3}
          color="amber"
        />
      </div>
      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Workspace access</h2>
            <p className="mt-1 text-xs text-slate-500">Demo team directory</p>
          </div>
          <button className="secondary-button">
            <Filter size={14} /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Last active</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[
                {
                  n: "Love Bharadwaj",
                  e: "love@acme.io",
                  r: "Owner",
                  a: "Now",
                  i: "LB",
                },
                {
                  n: "Aarav Sharma",
                  e: "aarav@acme.io",
                  r: "Admin",
                  a: "15 min ago",
                  i: "AS",
                },
                {
                  n: "Priya Verma",
                  e: "priya@acme.io",
                  r: "Analyst",
                  a: "2 hours ago",
                  i: "PV",
                },
                {
                  n: "Rohan Mehta",
                  e: "rohan@acme.io",
                  r: "Viewer",
                  a: "Yesterday",
                  i: "RM",
                },
              ].map((x) => (
                <tr key={x.e}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="user-avatar">{x.i}</div>
                      <div>
                        <div className="text-xs font-semibold text-slate-100">
                          {x.n}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          {x.e}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                      {x.r}
                    </span>
                  </td>
                  <td>{x.a}</td>
                  <td>
                    <span className="status-pill status-ready">
                      <span className="status-dot" /> Active
                    </span>
                  </td>
                  <td>
                    <button className="icon-button">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
