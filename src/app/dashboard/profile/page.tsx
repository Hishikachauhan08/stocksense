'use client'

import { useSession, signOut } from 'next-auth/react'
import { User, Mail, Shield, LogOut, Key } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">User Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Account details and security preferences
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{session?.user?.name || 'Admin User'}</h2>
            <p className="text-xs text-slate-400">{session?.user?.email || 'admin@stocksense.com'}</p>
            <span className="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800">
              <Shield className="w-2.5 h-2.5 mr-1" />
              {(session?.user as any)?.role?.toUpperCase() || 'ADMINISTRATOR'}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-5 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-750">
            <div className="flex items-center gap-2 text-slate-300">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Password & Security</span>
            </div>
            <Link
              href="/forgot-password"
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Reset via OTP
            </Link>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-750">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Role Permissions</span>
            </div>
            <span className="font-mono text-slate-400">Full Access (All Modules)</span>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 flex justify-end">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
