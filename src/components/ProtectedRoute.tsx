"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '@/components/Auth';
import { supabase, isMockMode } from '@/lib/supabaseClient';

/**
 * 🔐 ProtectedRoute Component
 * This wrapper ensures only logged-in users can access the content inside (the children).
 * If the user isn't logged in, it shows the Auth / Login screen instead.
 */
export default function ProtectedRoute({ children }: { children: (userId: string, email: string) => React.ReactNode }) {
  // --- STATE ---
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isMockMode) {
      // 🧊 MOCK AUTH: Check for local storage markers
      const mockId = localStorage.getItem('mockUserId');
      const mockEmail = localStorage.getItem('mockUserEmail');
      if (mockId && mockEmail) {
        setUserId(mockId);
        setEmail(mockEmail);
      }
      setLoading(false);
    } else {
      // 📡 LIVE AUTH: Fetch current session from Supabase
      
      /**
       * ⚠️ Safety Timeout
       * If Supabase is unreachable (wrong URL/key), getSession() might hang forever.
       * We stop the loading spinner after 8 seconds to allow the user to see the Login / Error screen.
       */
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 8000);

      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          clearTimeout(timeout);
          setUserId(session?.user?.id || null);
          setEmail(session?.user?.email || null);
          setLoading(false);
        })
        .catch(() => {
          clearTimeout(timeout);
          setLoading(false);
        });

      // Listen for login/logout events (e.g., if a user logs in via another tab)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUserId(session?.user?.id || null);
        setEmail(session?.user?.email || null);
      });

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }
  }, []);

  // --- RENDERING ---

  // 1. Show a spinner while we check the auth status
  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading...</div>;
  }

  // 2. If no user is logged in, show the Login/Signup screen
  if (!userId || !email) {
    return <Auth onLogin={(id, mail) => { 
      setUserId(id); 
      setEmail(mail); 
      router.push('/dashboard');
    }} />;
  }
  
  // 3. If everything is fine, show the private content
  return <>{children(userId, email)}</>;
}
