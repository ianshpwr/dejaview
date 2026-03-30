'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Download, LogOut, Shield } from 'lucide-react';
import { Sidebar, MobileTabBar } from '@/app/components/Sidebar';
import { getToken, getUser, setToken, clearToken } from '@/lib/auth';
import { getEntries } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [nameEditing, setNameEditing] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) { router.replace('/auth'); return; }
    const u = getUser();
    setUser(u as { id: number; name: string; email: string });
    setDisplayName(u?.name ?? '');
  }, [mounted, router]);

  if (!mounted) return null;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const handleExport = async () => {
    if (!user) return;
    try {
      const entries = await getEntries(user.id);
      const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'dejaview-export.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('Exported successfully!');
    } catch { showToast('Export failed. Please try again.'); }
  };

  const handleSignOut = () => {
    clearToken();
    router.replace('/auth');
  };

  const handleNameSave = async () => {
    if (!displayName.trim() || displayName.trim() === user?.name) {
      setNameEditing(false);
      return;
    }
    setNameSaving(true);
    try {
      const res = await fetch(`${BASE}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      const { token } = await res.json();
      setToken(token);
      const updated = getUser();
      setUser(updated);
      setDisplayName(updated?.name ?? displayName.trim());
      setNameEditing(false);
      showToast('Name updated ✓');
    } catch {
      showToast('Failed to update name. Try again.');
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-beige">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 pb-24 md:pb-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[28px] text-dark mb-1 font-heading">Settings</h1>
          <p className="text-[15px] text-muted font-sans">Manage your Dejaview preferences</p>
        </motion.div>

        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-4 py-3 bg-surface border border-pink-light rounded-[12px] text-[14px] text-dark font-sans shadow-sm"
          >
            {toast}
          </motion.div>
        )}

        <div className="mt-10 space-y-8 max-w-xl">
          {/* Profile */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="bg-surface border border-pink-light/30 rounded-[16px] overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-pink-light/30 bg-beige/50">
              <User size={16} className="text-coral" />
              <span className="text-[16px] font-medium text-dark font-heading">Profile</span>
            </div>
            <div className="divide-y divide-pink-light/20">
              {/* Display name — editable */}
              <div className="flex items-center justify-between px-5 py-4 gap-4">
                <span className="text-[14px] text-dark font-sans font-medium flex-shrink-0">Display name</span>
                {nameEditing ? (
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setNameEditing(false); }}
                      autoFocus
                      className="bg-beige border border-pink-light focus:border-coral rounded-[8px] px-3 py-1.5 text-[14px] text-dark font-sans outline-none focus:ring-2 focus:ring-coral/15 w-40"
                    />
                    <button
                      onClick={handleNameSave}
                      disabled={nameSaving}
                      className="text-[13px] font-medium text-white bg-coral rounded-[8px] px-3 py-1.5 font-sans disabled:opacity-50"
                    >
                      {nameSaving ? '…' : 'Save'}
                    </button>
                    <button onClick={() => { setNameEditing(false); setDisplayName(user?.name ?? ''); }}
                      className="text-[13px] text-muted font-sans">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] text-muted font-sans">{user?.name ?? '…'}</span>
                    <button onClick={() => setNameEditing(true)}
                      className="text-[12px] text-coral font-sans font-medium hover:opacity-75 transition-opacity">
                      Edit
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-[14px] text-dark font-sans font-medium">Email</span>
                <span className="text-[14px] text-muted font-sans">{user?.email ?? '…'}</span>
              </div>
            </div>
          </motion.div>

          {/* NOTIFICATIONS_HIDDEN */}
          <div style={{ display: 'none' }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="bg-surface border border-pink-light/30 rounded-[16px] overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-pink-light/30 bg-beige/50">
                <span className="text-[16px] font-medium text-dark font-heading">Notifications</span>
              </div>
              <div className="divide-y divide-pink-light/20">
                {[
                  { id: 'reminders', label: 'Daily writing reminder' },
                  { id: 'digest', label: 'Weekly insights digest' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-4">
                    <span className="text-[14px] text-dark font-sans font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          {/* END_NOTIFICATIONS_HIDDEN */}

          {/* Data */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="bg-surface border border-pink-light/30 rounded-[16px] overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-pink-light/30 bg-beige/50">
              <Shield size={16} className="text-coral" />
              <span className="text-[16px] font-medium text-dark font-heading">Data &amp; Privacy</span>
            </div>
            <div className="divide-y divide-pink-light/20">
              <div className="px-5 py-4">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 text-[14px] text-dark font-sans font-medium hover:text-coral transition-colors"
                >
                  <Download size={16} className="text-coral" />
                  Export my journal
                </button>
                <p className="text-[12px] text-muted font-sans mt-1">Downloads all your entries as a JSON file.</p>
              </div>
              <div className="px-5 py-4">
                <button
                  onClick={() => {
                    const confirmed = prompt('Type DELETE to confirm account deletion:');
                    if (confirmed === 'DELETE') showToast('Account deletion coming soon. Contact support for now.');
                  }}
                  className="text-[14px] text-coral font-sans font-medium hover:opacity-75 transition-opacity"
                >
                  Delete account
                </button>
                <p className="text-[12px] text-muted font-sans mt-1">This action is irreversible.</p>
              </div>
            </div>
          </motion.div>

          {/* Sign out */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-[15px] font-medium text-dark bg-white border border-pink-light/50 rounded-[12px] py-3.5 hover:bg-pink-light/10 transition-colors font-sans shadow-sm"
          >
            <LogOut size={16} className="text-coral" />
            Sign out
          </motion.button>
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
}
