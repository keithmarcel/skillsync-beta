'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your application settings here.</p>
        {/* Settings content will go here */}
      </div>
    </AdminGuard>
  );
}
