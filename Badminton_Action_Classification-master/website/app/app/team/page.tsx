"use client";

import { useState, useRef, useEffect } from "react";
import { TEAM } from "@/lib/workspace";

const ROLE_STYLE: Record<string, string> = {
  Owner: "bg-indigo/10 text-indigo dark:text-cyan",
  Analyst: "bg-cyan/10 text-indigo dark:text-cyan",
  Coach: "bg-success/10 text-success",
  Viewer: "bg-elevated text-muted",
};

export default function TeamPage() {
  const [members, setMembers] = useState(TEAM);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Viewer");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    
    const initials = newName.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "U";
    setMembers([...members, { name: newName, email: newEmail, role: newRole, initials }]);
    
    setNewName("");
    setNewEmail("");
    setNewRole("Viewer");
    setIsInviteOpen(false);
  };

  const handleRemove = (email: string) => {
    setMembers(members.filter((m) => m.email !== email));
    setActiveDropdown(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Team</h2>
          <p className="mt-1 text-sm text-muted">Manage who can access your classification workspace.</p>
        </div>
        <button 
          type="button" 
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas hover:-translate-y-0.5 transition-transform"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Invite member
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-surface shadow-card">
        <div className="divide-y" ref={dropdownRef}>
          {members.length === 0 && (
            <div className="p-8 text-center text-sm text-muted">No team members found.</div>
          )}
          {members.map((m) => (
            <div key={m.email} className="flex items-center gap-4 px-5 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo to-cyan text-sm font-semibold text-white">
                {m.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                <p className="truncate text-xs text-muted">{m.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLE[m.role] || ROLE_STYLE.Viewer}`}>{m.role}</span>
              
              <div className="relative ml-2 shrink-0">
                <button 
                  type="button" 
                  aria-label="Member options" 
                  onClick={() => setActiveDropdown(activeDropdown === m.email ? null : m.email)}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-ink transition-colors ${activeDropdown === m.email ? 'bg-elevated text-ink' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
                </button>

                {activeDropdown === m.email && (
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border bg-surface p-1 shadow-lg z-10 animate-in fade-in zoom-in-95 duration-100">
                    <button 
                      onClick={() => handleRemove(m.email)}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink">Invite new member</h3>
              <button 
                onClick={() => setIsInviteOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-elevated hover:text-ink transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-ink">Name</label>
                <input 
                  id="name"
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all placeholder:text-muted/60"
                  placeholder="e.g. Alex Chen"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-ink">Email address</label>
                <input 
                  id="email"
                  type="email" 
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all placeholder:text-muted/60"
                  placeholder="alex@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="role" className="text-sm font-medium text-ink">Role</label>
                <select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full appearance-none rounded-xl border bg-transparent px-4 py-2.5 text-sm text-ink outline-none focus:border-indigo focus:ring-1 focus:ring-indigo transition-all"
                >
                  <option value="Owner">Owner</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Coach">Coach</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-muted hover:bg-elevated transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-canvas hover:opacity-90 transition-opacity"
                >
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
