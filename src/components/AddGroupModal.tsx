"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/lib/store/auth-store";
import { useChatStore } from "@/lib/store/chat-store";
import { listAddableUsers } from "@/lib/data/services";
import { displayName } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export default function AddGroupModal({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const createGroup = useChatStore((s) => s.createGroup);

  const [name, setName] = useState("");
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    if (user) listAddableUsers(user.id).then(setAllUsers);
  }, [user]);

  const available = useMemo(
    () => allUsers.filter((u) => u.email !== user?.email),
    [allUsers, user]
  );

  const toggle = (email: string) =>
    setAdded((a) => (a.includes(email) ? a.filter((e) => e !== email) : [...a, email]));

  const submit = async () => {
    if (!name.trim() || !user) return;
    await createGroup(name.trim(), user.email, added);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="mb-4 text-lg font-bold">Create a group</h3>

      <label className="label">Group name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Makati Buyers"
        className="input mb-4"
      />

      <label className="label">Add members</label>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
        {available.map((u) => {
          const on = added.includes(u.email);
          return (
            <button
              key={u.id}
              onClick={() => toggle(u.email)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition ${
                on ? "bg-primary-50" : "hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Avatar email={u.email} size={30} />
                <span className="text-sm">{displayName(u.email)}</span>
              </span>
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border text-xs ${
                  on ? "border-primary bg-primary text-white" : "border-slate-300"
                }`}
              >
                {on ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={submit}
        disabled={!name.trim()}
        className="btn-accent mt-5 w-full"
      >
        Create group
      </button>
    </Modal>
  );
}
