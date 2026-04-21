"use client";
import ProtectedRoute from '@/components/ProtectedRoute';
import LogsApp from '@/components/LogsApp';

export default function LogsPage() {
  return (
    <ProtectedRoute>
      {() => <LogsApp />}
    </ProtectedRoute>
  );
}
