"use client";
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CalendarBoard from '@/components/CalendarBoard';

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      {(userId, email) => <CalendarBoard userId={userId} />}
    </ProtectedRoute>
  );
}
