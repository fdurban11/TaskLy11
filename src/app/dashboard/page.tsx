"use client";
import TaskBoard from '@/components/TaskBoard';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      {(userId, email) => <TaskBoard userId={userId} userEmail={email} />}
    </ProtectedRoute>
  );
}
