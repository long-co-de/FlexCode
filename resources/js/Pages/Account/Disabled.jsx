import React from 'react';
import { router } from '@inertiajs/react';

export default function Disabled({ user }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-xl w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-amber-500 grid place-items-center text-slate-900 font-extrabold text-xl">⚠</div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Account paused</h1>
            <p className="mt-2 text-sm text-gray-300">Your account access has been paused. This can happen for security or policy reasons. To restore access, please contact our support team — include your name and email so we can help faster.</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.visit(route('contact'))}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              >
                Contact support
              </button>

              <button
                onClick={() => router.post(route('logout'))}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Sign out
              </button>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <div><strong>Name:</strong> {user?.name || '—'}</div>
              <div><strong>Email:</strong> {user?.email || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
