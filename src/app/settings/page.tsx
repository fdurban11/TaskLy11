"use client";
import ProtectedRoute from '@/components/ProtectedRoute';
import SettingsApp from '@/components/SettingsApp';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      {(userId, email) => <SettingsApp userId={userId} userEmail={email} />}
    </ProtectedRoute>
  );
}
