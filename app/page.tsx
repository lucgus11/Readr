'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Edit3 } from 'lucide-react';
import { useStore } from '@/store';
import { getAllNotes, saveNote, deleteNote } from '@/lib/db';
import { BottomNav } from '@/components/layout/BottomNav';
import { generateId, formatDate, NOTE_COLORS } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { BookNote, NoteType } from '@/types';

const TYPE_LABELS: Record<NoteType, { icon: string; label: string }> = {
  note: { icon: '📝', label: 'Note' },
  highlight: { icon: '✏️', label: 'Highlight' },
  quote: { icon: '💬', label: 'Quote' },
};

export default function NotesPage() {
  const { notes, setNotes, addNote, removeNote, books } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<NoteType | 'all'>('all');
  const [bookFilter, setBookFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingNote, setEditingNote] = useState<BookNote | null>(null);

  useEffect(() => { getAllNotes().then(setNotes); }, [setNotes]);

  const filtered = useMemo(() => {
    let r = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (typeFilter !== 'all') r = r.filter(n => n.type === typeFilter);
    if (bookFilter !== 'all') r = r.filter(n => n.bookId === bookFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(n => n.content.toLowerCase().includes(q) || n.bookTitle.toLowerCase().includes(q));
    }
    return r;
  }, [notes, typeFilter, bookFilter, search]);

  const booksWithNotes = useMemo(() => {
    const ids = Array.from(new Set(notes.map(n => n.bookId)));
    return ids.map(id => ({ bookId: id, bookTitle: notes.find(n => n.bookId === id)!.bookTitle }));
  }, [notes]);

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    removeNote(id);
    toast.success('Note deleted');
  };

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="sticky top-0 z-40" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="page-title">Notes</h1>
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5 py-2 px-3">
              <Plus size={15} /> Add
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
            <input type="text" className="input-base pl-9" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'note', 'highlight', 'quote'] as const).map(type => (
              <button key={type} onClick={() => setTypeFilter(type)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                style={{ background: typeFilter === type ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: typeFilter === type ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                {type === 'all' ? '📋 All' : `${TYPE_LABELS[type].icon} ${TYPE_LABELS[type].label}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {booksWithNotes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setBookFilter('all')}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ background: bookFilter === 'all' ? 'var(--text-primary)' : 'var(--bg-secondary)', color: bookFilter === 'all' ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
              All books
            </button>
            {booksWithNotes.map(({ bookId, bookTitle }) => (
              <button key={bookId} onClick={() => setBookFilter(bookId)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{ background: bookFilter === bookId ? 'var(--text-primary)' : 'var(--bg-secondary)', color: bookFilter === bookId ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                {bookTitle}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {(['note', 'highlight', 'quote'] as NoteType[]).map(type => (
            <div key={type} className="card flex-1 p-3 text-center">
              <p className="text-lg">{TYPE_LABELS[type].icon}</p>
              <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {notes.filter(n => n.type === type).length}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[type].label}s</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {notes.length === 0 ? 'Add notes, highlights and quotes from your books' : 'Try a different search'}
            </p>
            {notes.length === 0 && <button onClick={() => setShowAdd(true)} className="btn-primary mt-3">Add your first note</button>}
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {filtered.map(note => (
              <div key={note.id} className="card p-4" style={{ borderLeft: `3px solid ${note.color || 'var(--accent-primary)'}` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs">{TYPE_LABELS[note.type].icon}</span>
                    <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-faint)' }}>{TYPE_LABELS[note.type].label}</span>
                    {note.page && <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>· p.{note.page}</span>}
                    <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>· {formatDate(note.createdAt, 'MMM d')}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditingNote(note)} className="btn-ghost p-1.5"><Edit3 size={12} /></button>
                    <button onClick={() => handleDelete(note.id)} className="btn-ghost p-1.5 opacity-50 hover:opacity-100"><Trash2 size={12} /></button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', fontStyle: note.type === 'quote' ? 'italic' : 'normal', fontFamily: note.type === 'quote' ? 'var(--font-display)' : 'inherit' }}>
                  {note.type === 'quote' ? `"${note.content}"` : note.content}
                </p>
                <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>📖 {note.bookTitle}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showAdd || editingNote) && (
        <NoteModal
          books={books}
          note={editingNote}
          onClose={() => { setShowAdd(false); setEditingNote(null); }}
          onSave={async (note) => {
            await saveNote(note);
            addNote(note);
            setShowAdd(false);
            setEditingNote(null);
            toast.success(editingNote ? 'Note updated!' : 'Note saved!');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

function NoteModal({ books, note, onClose, onSave }: {
  books: import('@/types').UserBook[];
  note: BookNote | null;
  onClose: () => void;
  onSave: (note: BookNote) => void;
}) {
  const [type, setType] = useState<NoteType>(note?.type || 'note');
  const [content, setContent] = useState(note?.content || '');
  const [page, setPage] = useState(note?.page?.toString() || '');
  const [color, setColor] = useState(note?.color || NOTE_COLORS[0]);
  const [bookId, setBookId] = useState(note?.bookId || books[0]?.id || '');

  const selectedBook = books.find(b => b.id === bookId);

  const handleSave = () => {
    if (!content.trim()) { toast.error('Please enter some content'); return; }
    if (!bookId) { toast.error('Please select a book'); return; }
    onSave({
      id: note?.id || generateId(),
      bookId,
      bookTitle: selectedBook?.title || '',
      type,
      content: content.trim(),
      page: page ? parseInt(page) : undefined,
      color,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>{note ? 'Edit Note' : 'New Note'}</h2>
          <button onClick={onClose} className="btn-ghost px-2 py-1 text-sm">✕</button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '80svh' }}>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Type</label>
            <div className="flex gap-2 mt-1.5">
              {(['note', 'highlight', 'quote'] as NoteType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: type === t ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: type === t ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                  {TYPE_LABELS[t].icon} {TYPE_LABELS[t].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Book</label>
            <select className="input-base mt-1.5" value={bookId} onChange={e => setBookId(e.target.value)}>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Content</label>
            <textarea autoFocus className="input-base mt-1.5 resize-none" rows={5}
              placeholder={type === 'quote' ? 'Paste a quote…' : type === 'highlight' ? 'Paste highlighted passage…' : 'Your thoughts…'}
              value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Page (optional)</label>
              <input type="number" className="input-base mt-1.5" placeholder="42" value={page} onChange={e => setPage(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Color</label>
              <div className="flex gap-1.5 mt-2">
                {NOTE_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full transition-all"
                    style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full">{note ? 'Update Note' : 'Save Note'}</button>
        </div>
      </div>
    </div>
  );
}
