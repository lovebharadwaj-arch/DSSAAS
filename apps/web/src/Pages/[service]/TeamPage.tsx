import { Clock3, Filter, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../component/dashboard/PageHeader";
import StatCard from "../../component/dashboard/StatCard";
import { useAuth } from "../../context/authContext";
import {
  addOrganizationMember,
  getOrganizationMembers,
  updateOrganizationMemberRole,
  type OrganizationMember,
} from "../../lib/organizationApi";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  analyst: "Analyst",
  viewer: "Viewer",
};

export default function TeamPage() {
  const { user, token } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "analyst" | "viewer">(
    "viewer",
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const organizationId = sessionStorage.getItem("organizationId") ?? "";

  const currentUserRole = useMemo(
    () => members.find((member) => member.user_id === user?.id)?.role ?? null,
    [members, user?.id],
  );

  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";
  const roleOptions: Array<"admin" | "analyst" | "viewer"> =
    currentUserRole === "owner"
      ? ["admin", "analyst", "viewer"]
      : ["analyst", "viewer"];

  async function fetchMembers() {
    if (!token || !organizationId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getOrganizationMembers(token, organizationId);
      setMembers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load team members.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMembers();
  }, [token, organizationId]);

  const handleInviteMember = async () => {
    if (!canManageMembers || !token || !organizationId) {
      return;
    }

    const email = inviteEmail.trim();
    if (!email) {
      setError("Enter a valid email to invite a team member.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await addOrganizationMember(token, organizationId, email, inviteRole);
      setInviteEmail("");
      setInviteRole(currentUserRole === "owner" ? "admin" : "viewer");
      await fetchMembers();
      setNotice("Member added successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add member.");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (
    member: OrganizationMember,
    nextRole: "admin" | "analyst" | "viewer",
  ) => {
    if (
      !canManageMembers ||
      !token ||
      !organizationId ||
      member.user_id === user?.id
    ) {
      return;
    }

    if (currentUserRole === "admin" && nextRole === "admin") {
      setError("Admins cannot promote someone to admin.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateOrganizationMemberRole(
        token,
        organizationId,
        member.user_id,
        nextRole,
      );
      await fetchMembers();
      setNotice(`${member.name} is now a ${roleLabels[nextRole]}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update member role.",
      );
    } finally {
      setSaving(false);
    }
  };

  const adminCount = members.filter((member) => member.role === "admin").length;
  const ownerCount = members.filter((member) => member.role === "owner").length;

  return (
    <>
      <PageHeader
        eyebrow="COLLABORATION"
        title="Team members"
        subtitle="Manage access to your workspace and collaborate securely."
        action="Invite member"
        onAction={() => {
          if (!canManageMembers) {
            setError("You need owner or admin access to invite members.");
            return;
          }
          void handleInviteMember();
        }}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Members"
          value={String(members.length)}
          change="Live workspace roster"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Admins"
          value={String(adminCount)}
          change={
            ownerCount > 0
              ? `${ownerCount} owner${ownerCount > 1 ? "s" : ""}`
              : "No owners"
          }
          icon={ShieldCheck}
          color="violet"
        />
        <StatCard
          label="Access"
          value={currentUserRole ? roleLabels[currentUserRole] : "Guest"}
          change={canManageMembers ? "Member management enabled" : "View only"}
          icon={Clock3}
          color="amber"
        />
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      {canManageMembers && (
        <section className="panel mb-5 p-5 sm:p-6">
          <h2 className="font-semibold text-white">Invite a member</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_180px_auto]">
            <input
              className="form-input"
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="member@email.com"
            />
            <select
              className="form-select"
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(
                  event.target.value as "admin" | "analyst" | "viewer",
                )
              }>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="primary-button disabled:opacity-60"
              onClick={() => void handleInviteMember()}
              disabled={saving || !inviteEmail.trim()}>
              {saving ? "Adding..." : "Add member"}
            </button>
          </div>
        </section>
      )}

      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Workspace access</h2>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Loading team members..." : "Live team directory"}
            </p>
          </div>
          <button className="secondary-button" type="button">
            <Filter size={14} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const initials = member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const canEditRole =
                  canManageMembers &&
                  member.user_id !== user?.id &&
                  !(currentUserRole === "admin" && member.role === "admin") &&
                  !(currentUserRole === "admin" && member.role === "owner");

                return (
                  <tr key={member.user_id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="user-avatar">{initials}</div>
                        <div>
                          <div className="text-xs font-semibold text-slate-100">
                            {member.name}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {canEditRole ? (
                        <select
                          className="form-select min-w-[120px]"
                          value={member.role}
                          onChange={(event) =>
                            void handleRoleChange(
                              member,
                              event.target.value as
                                | "admin"
                                | "analyst"
                                | "viewer",
                            )
                          }
                          disabled={saving}>
                          {roleOptions.map((option) => (
                            <option key={option} value={option}>
                              {roleLabels[option]}
                            </option>
                          ))}
                          {member.role === "owner" && (
                            <option value="owner">Owner</option>
                          )}
                        </select>
                      ) : (
                        <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                          {roleLabels[member.role]}
                        </span>
                      )}
                    </td>
                    <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                    <td>
                      <span className="status-pill status-ready">
                        <span className="status-dot" /> Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
