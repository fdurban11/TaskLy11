"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import styles from './NotesApp.module.css';

export interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function NotesApp({ userId }: { userId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  useEffect(() => {
    // For simplicity, we store notes in localStorage keyed by user
    const savedNotes = localStorage.getItem(`notes_${userId}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      const defaultNote: Note = {
        id: '1',
        title: 'Welcome to Notes',
        content: 'Jot down your daily thoughts and meeting minutes here. They are automatically saved locally!',
        updated_at: new Date().toISOString()
      };
      setNotes([defaultNote]);
      localStorage.setItem(`notes_${userId}`, JSON.stringify([defaultNote]));
    }
  }, [userId]);

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem(`notes_${userId}`, JSON.stringify(newNotes));
  };

  const createNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Untitled Note',
      content: '',
      updated_at: new Date().toISOString()
    };
    const newNotes = [newNote, ...notes];
    saveNotes(newNotes);
    setActiveNote(newNote);
  };

  const updateActiveNote = (field: 'title' | 'content', value: string) => {
    if (!activeNote) return;
    const updatedNote = { ...activeNote, [field]: value, updated_at: new Date().toISOString() };
    setActiveNote(updatedNote);
    const newNotes = notes.map(n => n.id === activeNote.id ? updatedNote : n);
    saveNotes(newNotes);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newNotes = notes.filter(n => n.id !== id);
    saveNotes(newNotes);
    if (activeNote?.id === id) setActiveNote(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '20px', background: 'linear-gradient(90deg, var(--text-highlight), var(--text-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Note Taker
      </h1>
      
      <div className={styles.notesContainer}>
        <div className={styles.sidebar}>
          <button className={`btn btn-primary ${styles.newNoteBtn}`} onClick={createNote}>
            <Plus size={18} /> New Note
          </button>
          
          <div className={styles.notesList}>
            {notes.map(note => (
              <div 
                key={note.id} 
                className={`${styles.noteItem} ${activeNote?.id === note.id ? styles.active : ''}`}
                onClick={() => setActiveNote(note)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={styles.noteTitle}>{note.title || 'Untitled Note'}</div>
                  <button onClick={(e) => deleteNote(note.id, e)} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className={styles.notePreview}>
                  {note.content ? note.content.substring(0, 30) + '...' : 'No content'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {activeNote ? (
          <div className={styles.editor}>
            <input 
              type="text" 
              className={styles.titleInput}
              value={activeNote.title}
              onChange={(e) => updateActiveNote('title', e.target.value)}
              placeholder="Note Title"
            />
            <textarea 
              className={styles.contentInput}
              value={activeNote.content}
              onChange={(e) => updateActiveNote('content', e.target.value)}
              placeholder="Start typing your notes here..."
            />
            <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontSize: '0.8rem' }}>
              <Save size={14} /> Auto-saved
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            Select a note or create a new one to start writing.
          </div>
        )}
      </div>
    </div>
  );
}
