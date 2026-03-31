"use client";
import { useState } from 'react';

const SQL = `create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'Pending',
  priority text not null default 'Medium',
  assigned_date timestamptz,
  due_date timestamptz,
  due_time text,
  archived boolean default false,
  created_at timestamptz default now()
);

alter table public.tasks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tasks'
    and policyname = 'Users can manage their own tasks'
  ) then
    execute $policy$
      create policy "Users can manage their own tasks"
        on public.tasks
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id)
    $policy$;
  end if;
end;
$$;`;

export default function SetupPage() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0a0a0f)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'var(--font-outfit, sans-serif)',
    }}>
      <div style={{
        maxWidth: '720px',
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '40px',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗄️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Database Setup Required</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '10px', lineHeight: 1.6 }}>
            The <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>tasks</code> table
            doesn&apos;t exist in your Supabase project yet. Follow these 3 steps to fix it.
          </p>
        </div>

        {/* Step 1 */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5cc, #0096ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
            }}>1</span>
            <strong style={{ fontSize: '1rem' }}>Open the Supabase SQL Editor</strong>
          </div>
          <a
            href="https://supabase.com/dashboard/project/lwewxnlsakgbtjhajbnf/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #00e5cc22, #0096ff22)',
              border: '1px solid #00e5cc55',
              borderRadius: '10px', padding: '10px 18px',
              color: '#00e5cc', textDecoration: 'none', fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
          >
            🔗 Open Supabase SQL Editor →
          </a>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginTop: '8px' }}>
            Log in to your Supabase account if prompted.
          </p>
        </div>

        {/* Step 2 */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5cc, #0096ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
            }}>2</span>
            <strong style={{ fontSize: '1rem' }}>Copy & paste this SQL</strong>
          </div>
          <div style={{ position: 'relative' }}>
            <pre style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
              overflowX: 'auto',
              fontSize: '0.78rem',
              lineHeight: 1.7,
              color: '#a8e6cf',
              margin: 0,
            }}>{SQL}</pre>
            <button
              onClick={copy}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                background: copied ? 'rgba(0,229,204,0.2)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', padding: '6px 14px',
                color: copied ? '#00e5cc' : '#fff',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Copied!' : 'Copy SQL'}
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5cc, #0096ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
            }}>3</span>
            <strong style={{ fontSize: '1rem' }}>Click &ldquo;Run&rdquo; in Supabase, then come back</strong>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>
            After running the SQL, click the button below to go to your dashboard. Tasks will work immediately.
          </p>
        </div>

        <a
          href="/dashboard"
          style={{
            display: 'block', textAlign: 'center',
            background: 'linear-gradient(135deg, #00e5cc, #0096ff)',
            borderRadius: '12px', padding: '14px',
            color: '#000', fontWeight: 700, textDecoration: 'none',
            fontSize: '1rem', letterSpacing: '0.02em',
          }}
        >
          ✅ Done! Go to Dashboard →
        </a>
      </div>
    </div>
  );
}
