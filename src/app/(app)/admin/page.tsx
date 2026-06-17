"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import Modal from "@/components/Modal";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAdminStore } from "@/lib/store/admin-store";
import { cn, displayName, formatDate, formatTime } from "@/lib/utils";
import type { BillingInterval, Plan, Profile } from "@/lib/types";

// Encodes plan + billing term in one <select> value for the Users tab.
type PlanChoice = "basic" | "premium:monthly" | "premium:annual";
const planChoiceOf = (u: Profile): PlanChoice =>
  u.plan === "premium"
    ? u.planInterval === "annual"
      ? "premium:annual"
      : "premium:monthly"
    : "basic";

const USERS_PER_PAGE = 50;

function AdminContent() {
  const router = useRouter();
  const admin = useAuthStore((s) => s.user)!;
  const { users, payments, logs, fetchAll, approve, reject, setPlan, setActive, resetPassword, message } =
    useAdminStore();

  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"payments" | "users" | "audit">("payments");
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; temp: string } | null>(null);
  const [messaging, setMessaging] = useState<Profile | null>(null);
  const [msgText, setMsgText] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState<Profile | null>(null);
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    fetchAll().then(() => setReady(true));
  }, [fetchAll]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2800);
  };

  const userOf = (id: string) => users.find((u) => u.id === id);
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? users.filter((u) => u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) : users;
  }, [users, query]);
  const userPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safeUserPage = Math.min(userPage, userPages);
  const pagedUsers = filteredUsers.slice((safeUserPage - 1) * USERS_PER_PAGE, safeUserPage * USERS_PER_PAGE);
  useEffect(() => setUserPage(1), [query]);

  const stats = {
    total: users.length,
    premium: users.filter((u) => u.plan === "premium").length,
    pending: payments.length,
    inactive: users.filter((u) => !u.active).length,
  };

  const onApprove = async (paymentId: string, userId: string, plan: Plan) => {
    await approve(admin, paymentId, userId, plan);
    flash(`✅ Payment approved — ${plan} activated & invoice issued.`);
  };
  const onReject = async (paymentId: string) => {
    await reject(admin, paymentId);
    flash("Payment rejected.");
  };
  const onPlanChoice = async (u: Profile, choice: PlanChoice) => {
    const plan: Plan = choice === "basic" ? "basic" : "premium";
    const interval: BillingInterval = choice === "premium:annual" ? "annual" : "monthly";
    await setPlan(admin, u.id, plan, interval);
    flash(
      plan === "premium"
        ? `${displayName(u.email)} locked into Premium (${interval}).`
        : `${displayName(u.email)} set to Basic.`
    );
  };
  const onToggleActive = async (u: Profile) => {
    if (u.active) {
      setConfirmDeactivate(u);
    } else {
      await setActive(admin, u.id, true);
      flash(`${displayName(u.email)} reactivated.`);
    }
  };
  const doDeactivate = async () => {
    if (!confirmDeactivate) return;
    await setActive(admin, confirmDeactivate.id, false);
    flash(`${displayName(confirmDeactivate.email)} deactivated.`);
    setConfirmDeactivate(null);
  };
  const onReset = async (u: Profile) => {
    const temp = await resetPassword(admin, u.id);
    setResetResult({ email: u.email, temp });
  };
  const sendMessage = async () => {
    if (!messaging || !msgText.trim()) return;
    await message(admin, messaging, msgText.trim());
    setMessaging(null);
    setMsgText("");
    flash("Message sent.");
  };

  const Stat = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className={cn("text-2xl font-bold", tone)}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Admin console</h1>
          <p className="text-sm text-slate-500">Manage payments, users, and review the audit trail.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tickets" className="btn-outline !py-1.5 text-xs">🎫 Tickets →</Link>
          <Link href="/admin/ai-requests" className="btn-outline !py-1.5 text-xs">🤖 AI requests →</Link>
          <Link href="/admin/accounting" className="btn-outline !py-1.5 text-xs">💰 Accounting →</Link>
          <Link href="/admin/verification" className="btn-outline !py-1.5 text-xs">✓ Verification →</Link>
        </div>
      </div>

      {toast && <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm text-white">{toast}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total users" value={stats.total} tone="text-ink" />
        <Stat label="Premium" value={stats.premium} tone="text-primary" />
        <Stat label="Pending payments" value={stats.pending} tone="text-amber-600" />
        <Stat label="Deactivated" value={stats.inactive} tone="text-danger" />
      </div>

      <div className="flex gap-1 border-b border-line">
        {([["payments", `Payments (${payments.length})`], ["users", "Users"], ["audit", "Audit log"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium transition", tab === t ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink")}>
            {label}
          </button>
        ))}
      </div>

      {!ready ? (
        <Spinner />
      ) : tab === "payments" ? (
        payments.length === 0 ? (
          <EmptyState icon="✅" title="No pending payments" description="Payment requests with proof of purchase appear here." />
        ) : (
          <div className="space-y-4">
            {payments.map((p) => {
              const u = userOf(p.userId);
              return (
                <div key={p.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row">
                  {p.attachmentUrl ? (
                    <button onClick={() => setProof(p.attachmentUrl!)} className="h-32 w-full shrink-0 overflow-hidden rounded-xl border border-line sm:w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.attachmentUrl} alt="Proof of payment" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <div className="grid h-32 w-full shrink-0 place-items-center rounded-xl border border-dashed border-line text-xs text-slate-400 sm:w-24">No proof</div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar email={u?.email ?? ""} size={32} />
                      <div>
                        <p className="text-sm font-semibold text-ink">{u ? displayName(u.email) : p.userId}</p>
                        <p className="text-xs text-slate-500">{u?.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <Badge tone="blue" className="capitalize">{p.plan}</Badge>
                      <span className="capitalize text-slate-500">{p.interval}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium">{p.reference}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-400">{formatDate(p.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => onApprove(p.id, p.userId, p.plan)} className="btn-accent">✅ Approve &amp; activate</button>
                      <button onClick={() => onReject(p.id)} className="btn-outline !text-danger">Reject</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "users" ? (
        <div className="space-y-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔍 Search users by name or email" className="input max-w-sm" />
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <ul className="divide-y divide-line">
              {pagedUsers.map((u) => {
                const isSelf = u.id === admin.id;
                return (
                  <li key={u.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar email={u.email} size={40} />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {displayName(u.email)}{u.isAdmin && <Badge tone="violet" className="ml-2">admin</Badge>}
                          {!u.active && <Badge tone="red" className="ml-2">deactivated</Badge>}
                        </p>
                        <p className="text-xs text-slate-500">{u.email} · <span className="font-mono">{u.code}</span></p>
                        <p className="mt-0.5 text-xs">
                          <span className={cn("font-semibold capitalize", u.plan === "premium" ? "text-primary" : "text-slate-500")}>
                            {u.plan}
                          </span>
                          {u.plan === "premium" && u.planInterval && (
                            <span className="text-slate-500"> · {u.planInterval}</span>
                          )}
                          {u.plan === "premium" && u.planRenewsAt && (
                            <span className="text-slate-400"> · renews {formatDate(u.planRenewsAt)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={planChoiceOf(u)}
                        onChange={(e) => onPlanChoice(u, e.target.value as PlanChoice)}
                        className="input !w-auto !py-1.5 text-xs"
                      >
                        <option value="basic">Basic</option>
                        <option value="premium:monthly">Premium · Monthly</option>
                        <option value="premium:annual">Premium · Annual</option>
                      </select>
                      <button onClick={() => { setMessaging(u); setMsgText(""); }} className="btn-outline !px-3 !py-1.5 text-xs">Message</button>
                      <button onClick={() => onReset(u)} className="btn-outline !px-3 !py-1.5 text-xs">Reset password</button>
                      <label className={cn("flex items-center gap-2 text-xs", isSelf && "opacity-40")}>
                        Active
                        <Switch checked={u.active} disabled={isSelf} onChange={() => onToggleActive(u)} />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
            {userPages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-4 py-2">
                <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={safeUserPage === 1} className="btn-outline !px-3 !py-1 text-xs">← Prev</button>
                <span className="text-xs text-slate-500">Page {safeUserPage} / {userPages} · {USERS_PER_PAGE}/page</span>
                <button onClick={() => setUserPage((p) => p + 1)} disabled={safeUserPage === userPages} className="btn-outline !px-3 !py-1 text-xs">Next →</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {logs.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No admin activity yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {logs.map((l) => (
                <li key={l.id} className="flex items-start gap-3 p-4">
                  <Avatar email={l.adminEmail} size={32} />
                  <div className="flex-1 text-sm">
                    <p>
                      <span className="font-semibold text-ink">{displayName(l.adminEmail)}</span>{" "}
                      <span className="text-slate-600">{l.action.toLowerCase()}</span>{" "}
                      <span className="font-medium text-ink">{l.target}</span>
                      {l.detail && <span className="text-slate-500"> — {l.detail}</span>}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(l.createdAt)} · {formatTime(l.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Proof viewer */}
      {proof && (
        <Modal onClose={() => setProof(null)} className="!max-w-lg">
          <h3 className="mb-3 text-lg font-bold">Proof of payment</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proof} alt="Proof of payment" className="max-h-[70vh] w-full rounded-lg object-contain" />
        </Modal>
      )}

      {/* Reset password result */}
      {resetResult && (
        <Modal onClose={() => setResetResult(null)}>
          <h3 className="text-lg font-bold">Password reset</h3>
          <p className="mt-2 text-sm text-slate-600">A temporary password was issued for <strong>{resetResult.email}</strong> and they&apos;ve been notified.</p>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-center font-mono text-lg font-bold tracking-wider text-ink">{resetResult.temp}</div>
          <button onClick={() => setResetResult(null)} className="btn-primary mt-4 w-full">Done</button>
        </Modal>
      )}

      {/* Message user */}
      {messaging && (
        <Modal onClose={() => setMessaging(null)}>
          <h3 className="text-lg font-bold">Message {displayName(messaging.email)}</h3>
          <p className="mb-3 text-sm text-slate-500">Sends a direct message and a notification.</p>
          <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)} rows={4} placeholder="Write your message about a concern…" className="input" />
          <div className="mt-4 flex gap-2">
            <button onClick={sendMessage} disabled={!msgText.trim()} className="btn-primary flex-1">Send message</button>
            <button onClick={() => router.push(`/messages?to=${messaging.id}`)} className="btn-outline">Open chat</button>
          </div>
        </Modal>
      )}

      {/* Confirm deactivate */}
      {confirmDeactivate && (
        <Modal onClose={() => setConfirmDeactivate(null)}>
          <h3 className="text-lg font-bold">Deactivate account?</h3>
          <p className="mt-2 text-sm text-slate-600"><strong>{displayName(confirmDeactivate.email)}</strong> will be unable to log in until reactivated.</p>
          <div className="mt-5 flex gap-2">
            <button onClick={doDeactivate} className="btn-danger flex-1">Deactivate</button>
            <button onClick={() => setConfirmDeactivate(null)} className="btn-outline flex-1">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGate requireAdmin>
      <AdminContent />
    </AuthGate>
  );
}
