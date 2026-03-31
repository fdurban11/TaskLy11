"use client";
import ProtectedRoute from '@/components/ProtectedRoute';
import NotesApp from '@/components/NotesApp';

export default function NotesPage() {
  return (
    <ProtectedRoute>
      {(userId, email) => <NotesApp userId={userId} />}
    </ProtectedRoute>
  );
}
