'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, FolderOpen, Trash2, Edit3, X, Check, BookOpen } from 'lucide-react';
import { useStore } from '@/store';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookDetailModal } from '@/components/books/BookDetailModal';
import { generateId, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { UserBook } from '@/types';

interface Collection {
  id: string;
  name: string;
  emoji: string;
  bookIds: string[];
  createdAt: string;
  color: string;
}

const COLLECTION_COLORS = ['#a97d4f','#0369a1','#15803d','#be185d','#7c3aed','#0891b2','#dc2626','#d97706'];
const EMOJIS = ['📚','🌟','🔥','💡','🎭','🌍','🧪','🎨','⚔️','💕','👻','🚀','🧠','🏔️','🌸'];

const STORAGE_KEY = 'readr-collections';

function loadCollections(): Collection[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveCollections(cols: Collection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
}

export default function CollectionsPage() {
  const books = useStore(s => s.books);
  const [collections, setCollections]   = useState<Collection[]>([]);
  const [editing, setEditing]           = useState<Collection | null>(null);
  const [creating, setCreating]         = useState(false);
  const [activeCol, setActiveCol]       = useState<Collection | null>(null);
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);
  const [addingTo, setAddingTo]         = useState<string | null>(null); // collection id

  // form state
  const [formName, setFormName]   = useState('');
  const [formEmoji, setFormEmoji] = useState('📚');
  const [formColor, setFormColor] = useState(COLLECTION_COLORS[0]);

  useEffect(() => { setCollections(loadCollections()); }, []);

  const saveAll = (cols: Collection[]) => { setCollections(cols); saveCollections(cols); };

  const handleCreate = () => {
    if (!formName.trim()) return toast.error('Give your collection a name');
    const col: Collection = {
      id: generateId(), name: formName.trim(), emoji: formEmoji,
      bookIds: [], createdAt: new Date().toISOString(), color: formColor,
    };
    saveAll([...collections, col]);
    setCreating(false); setFormName(''); setFormEmoji('📚'); setFormColor(COLLECTION_COLORS[0]);
    toast.success(`"${col.name}" created!`);
  };

  const handleEdit = () => {
    if (!editing || !formName.trim()) return;
    saveAll(collections.map(c => c.id === editing.id
      ? { ...c, name: formName.trim(), emoji: formEmoji, color: formColor }
      : c
    ));
    setEditing(null); toast.success('Collection updated!');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this collection?')) return;
    saveAll(collections.filter(c => c.id !== id));
    if (activeCol?.id === id) setActiveCol(null);
    toast.success('Deleted');
  };

  const handleAddBook = (colId: string, bookId: string) => {
    saveAll(collections.map(c => c.id === colId && !c.bookIds.includes(bookId)
      ? { ...c, bookIds: [...c.bookIds, bookId] } : c));
    setAddingTo(null);
    toast.success('Book added to collection!');
  };

  const handleRemoveBook = (colId: string, bookId: string) => {
    saveAll(collections.map(c => c.id === colId
      ? { ...c, bookIds: c.bookIds.filter(id => id !== bookId) } : c));
  };

  const openEdit = (col: Collection) => {
    setEditing(col); setFormName(col.name); setFormEmoji(col.emoji); setFormColor(col.color);
    setCreating(false);
  };

  const activeBooks = useMemo(() => {
    if (!activeCol) return [];
    return activeCol.bookIds.map(id => books.find(b => b.id === id)).filter(Boolean) as UserBook[];
  }, [activeCol, books, collections]);

  const notInActive = useMemo(() => {
    if (!addingTo) return [];
    const col = collections.find(c => c.id === addingTo);
    return books.filter(b => !col?.bookIds.includes(b.id));
  }, [addingTo, books, collections]);

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 safe-top px-4 pt-4 pb-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Collections</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Custom bookshelves</p>
          </div>
          <button onClick={() => { setCreating(true); setEditing(null); setFormName(''); }}
            className="btn-primary flex items-center gap-1.5 px-3 py-2">
            <Plus size={14} /><span className="text-xs">New</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">

        {/* Create / Edit Form */}
        {(creating || editing) && (
          <div className="card p-4 space-y-4 animate-fade-up"
            style={{ borderColor: 'var(--accent-primary)', borderWidth: 2 }}>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {editing ? 'Edit Collection' : 'New Collection'}
            </p>

            <div className="flex gap-2">
              {/* Emoji picker */}
              <div className="relative">
                <button className="w-12 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-colors"
                  style={{ background: 'var(--bg-secondary)', borderColor: formColor }}>
                  {formEmoji}
                </button>
                <div className="absolute top-full left-0 mt-1 p-2 rounded-xl z-10 grid grid-cols-5 gap-1"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setFormEmoji(e)}
                      className={cn('w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all',
                        formEmoji === e ? 'scale-110' : 'hover:scale-105')}
                      style={{ background: formEmoji === e ? 'var(--accent-light)' : 'transparent' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <input autoFocus placeholder="Collection name…" className="input-base flex-1"
                value={formName} onChange={e => setFormName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (editing ? handleEdit() : handleCreate())} />
            </div>

            {/* Color picker */}
            <div className="flex gap-2">
              {COLLECTION_COLORS.map(c => (
                <button key={c} onClick={() => setFormColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c,
                    outline: formColor === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transform: formColor === c ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={editing ? handleEdit : handleCreate}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Check size={14} /> {editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setCreating(false); setEditing(null); }}
                className="btn-secondary px-4">Cancel</button>
            </div>
          </div>
        )}

        {/* Collections list */}
        {collections.length === 0 && !creating ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📂</p>
            <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              No collections yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Create custom bookshelves to organise your library
            </p>
            <button onClick={() => setCreating(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={14} /> Create your first
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map(col => {
              const colBooks = col.bookIds.map(id => books.find(b => b.id === id)).filter(Boolean) as UserBook[];
              const isOpen = activeCol?.id === col.id;
              return (
                <div key={col.id} className="card overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setActiveCol(isOpen ? null : col)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: col.color + '20' }}>
                      {col.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                        {col.name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {col.bookIds.length} book{col.bookIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {/* Mini covers */}
                    <div className="flex -space-x-2 mr-2">
                      {colBooks.slice(0, 4).map(b => b.cover ? (
                        <img key={b.id} src={b.cover} alt="" className="w-6 h-8 rounded object-cover border border-white"
                          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      ) : (
                        <div key={b.id} className="w-6 h-8 rounded flex items-center justify-center text-[10px]"
                          style={{ background: col.color + '30' }}>📖</div>
                      ))}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={e => { e.stopPropagation(); openEdit(col); }}
                        className="btn-ghost p-1.5 rounded-lg"><Edit3 size={12} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(col.id); }}
                        className="btn-ghost p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-red-500">
                        <Trash2 size={12} /></button>
                    </div>
                  </div>

                  {/* Expanded books */}
                  {isOpen && (
                    <div className="border-t px-3 pb-3 space-y-2 animate-fade-up"
                      style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Books</p>
                        <button onClick={() => setAddingTo(col.id)}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded-full"
                          style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                          <Plus size={10} /> Add book
                        </button>
                      </div>

                      {colBooks.length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--text-faint)' }}>
                          No books yet — add some!
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {colBooks.map(book => (
                            <div key={book.id} className="flex items-center gap-2 p-2 rounded-lg"
                              style={{ background: 'var(--bg-secondary)' }}>
                              {book.cover ? (
                                <img src={book.cover} alt="" className="w-8 rounded object-cover flex-shrink-0"
                                  style={{ height: 48 }} />
                              ) : (
                                <div className="w-8 h-12 rounded flex items-center justify-center flex-shrink-0"
                                  style={{ background: 'var(--border)' }}>
                                  <BookOpen size={12} style={{ color: 'var(--text-faint)' }} />
                                </div>
                              )}
                              <button onClick={() => setSelectedBook(book)} className="flex-1 text-left min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                  {book.title}
                                </p>
                                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                                  {book.authors?.[0]}
                                </p>
                              </button>
                              <button onClick={() => handleRemoveBook(col.id, book.id)}
                                className="btn-ghost p-1 rounded opacity-50 hover:opacity-100 flex-shrink-0">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add book to collection picker */}
      {addingTo && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAddingTo(null)} />
          <div className="relative w-full max-w-lg rounded-t-2xl"
            style={{ background: 'var(--bg-card)', maxHeight: '70svh' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>Add to Collection</p>
              <button onClick={() => setAddingTo(null)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2" style={{ maxHeight: 'calc(70svh - 64px)' }}>
              {notInActive.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
                  All books already in this collection
                </p>
              ) : notInActive.map(book => (
                <button key={book.id} onClick={() => handleAddBook(addingTo, book.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:opacity-80 transition-opacity"
                  style={{ background: 'var(--bg-secondary)' }}>
                  {book.cover && (
                    <img src={book.cover} alt="" className="w-8 h-12 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{book.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{book.authors?.[0]}</p>
                  </div>
                  <Plus size={14} className="ml-auto flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
}
