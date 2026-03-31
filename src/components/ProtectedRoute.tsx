"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '@/components/Auth';
import { supabase, isMockMode } from '@/lib/supabaseClient';

export default function ProtectedRoute({ children }: { children: (userId: string, email: string) => React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isMockMode) {
      const mockId = localStorage.getItem('mockUserId');
      const mockEmail = localStorage.getItem('mockUserEmail');
      if (mockId && mockEmail) {
        setUserId(mockId);
        setEmail(mockEmail);
      }
      setLoading(false);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUserId(session?.user?.id || null);
        setEmail(session?.user?.email || null);
        setLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserId(session?.user?.id || null);
        setEmail(session?.user?.email || null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading...</div>;
  }

  if (!userId || !email) {
    return <Auth onLogin={(id, mail) => { 
      setUserId(id); 
      setEmail(mail); 
      router.push('/dashboard');
    }} />;
  }
  
  return <>{children(userId, email)}</>;
}
