"use client";
import ProtectedRoute from '@/components/ProtectedRoute';
import ArchiveBoard from '@/components/ArchiveBoard';

export default function ArchivePage() {
  return (
    <ProtectedRoute>
      {(userId, email) => <ArchiveBoard userId={userId} />}
    </ProtectedRoute>
  );
}
