import { useState, useEffect } from 'react';
import { notesAPI, aiAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';
import './Notes.css';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [form, setForm] = useState({ title: '', content: '', tags: '', is_pinned: false });

    useEffect(() => { loadNotes(); }, [searchQuery]);

    const loadNotes = async () => {
        try {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            const res = await notesAPI.list(params);
            setNotes(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedNote && editing) {
                await notesAPI.update(selectedNote.id, form);
            } else {
                await notesAPI.create(form);
            }
            setShowModal(false);
            setEditing(false);
            loadNotes();
        } catch (err) { console.error(err); }
    };

    const deleteNote = async (id) => {
        if (!confirm('Delete this note?')) return;
        await notesAPI.delete(id);
        if (selectedNote?.id === id) setSelectedNote(null);
        loadNotes();
    };

    const selectNote = (note) => {
        setSelectedNote(note);
        setEditing(false);
    };

    const startEdit = () => {
        setForm({
            title: selectedNote.title,
            content: selectedNote.content,
            tags: selectedNote.tags,
            is_pinned: selectedNote.is_pinned,
        });
        setEditing(true);
    };

    const newNote = () => {
        setForm({ title: '', content: '', tags: '', is_pinned: false });
        setSelectedNote(null);
        setShowModal(true);
    };

    const aiAssist = async (action) => {
        setAiLoading(true);
        try {
            let prompt = '';
            let context = '';
            if (action === 'expand') {
                prompt = `expand: ${selectedNote?.title || ''}`;
                context = selectedNote?.content || '';
            } else if (action === 'summarize') {
                prompt = `summarize: ${selectedNote?.title || ''}`;
                context = selectedNote?.content || '';
            } else if (action === 'organize') {
                prompt = `organize: ${selectedNote?.title || ''}`;
                context = selectedNote?.content || '';
            }
            const res = await aiAPI.noteAssist(prompt, context);
            if (editing) {
                setForm(f => ({ ...f, content: res.data.response }));
            } else if (selectedNote) {
                await notesAPI.update(selectedNote.id, { content: res.data.response });
                const updated = await notesAPI.get(selectedNote.id);
                setSelectedNote(updated.data);
                loadNotes();
            }
        } catch (err) {
            console.error('AI assist error:', err);
        } finally { setAiLoading(false); }
    };

    const aiCreate = async (topic) => {
        setAiLoading(true);
        try {
            const res = await aiAPI.noteAssist(`create: ${topic}`);
            setForm(f => ({ ...f, content: res.data.response, title: topic }));
        } catch (err) { console.error(err); }
        finally { setAiLoading(false); }
    };

    const togglePin = async (note) => {
        await notesAPI.update(note.id, { is_pinned: !note.is_pinned });
        loadNotes();
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="notes-page">
            <div className="page-header">
                <div>
                    <h1>📝 Notes</h1>
                    <p>Smart markdown notes with AI assistance</p>
                </div>
                <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
            </div>

            <div className="notes-layout">
                {/* Notes List */}
                <div className="notes-sidebar">
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                        <input
                            placeholder="🔍 Search notes..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="notes-list">
                        {notes.length === 0 ? (
                            <div className="empty-state" style={{ padding: '20px' }}>
                                <p>No notes yet</p>
                            </div>
                        ) : notes.map(note => (
                            <div
                                key={note.id}
                                className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                                onClick={() => selectNote(note)}
                            >
                                <div className="note-item-header">
                                    <span className="note-item-title">{note.is_pinned ? '📌 ' : ''}{note.title}</span>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>🗑</button>
                                </div>
                                <p className="note-item-preview">{note.content.substring(0, 80)}...</p>
                                <div className="note-item-meta">
                                    <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                    {note.tags && <span className="note-tags">{note.tags.split(',').slice(0, 2).map(t => `#${t.trim()}`).join(' ')}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Note View/Edit */}
                <div className="note-content-area glass-card">
                    {!selectedNote && !showModal ? (
                        <div className="empty-state">
                            <div className="icon">📝</div>
                            <h3>Select or create a note</h3>
                            <p>Your notes are stored in markdown format</p>
                            <button className="btn btn-primary" onClick={newNote}>Create Note</button>
                        </div>
                    ) : showModal ? (
                        <div className="note-editor">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <input
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        required
                                        placeholder="Note title"
                                        className="note-title-input"
                                    />
                                </div>
                                <div className="ai-bar">
                                    <button type="button" className="btn btn-secondary btn-sm" disabled={aiLoading}
                                        onClick={() => { const topic = prompt('Enter topic for AI note:'); if (topic) aiCreate(topic); }}>
                                        {aiLoading ? '⏳' : '🤖'} AI Create
                                    </button>
                                </div>
                                <div className="form-group">
                                    <textarea
                                        value={form.content}
                                        onChange={e => setForm({ ...form, content: e.target.value })}
                                        rows={15}
                                        placeholder="Write your note in markdown..."
                                        className="note-content-textarea"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tags (comma-separated)</label>
                                        <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g., python, learning, project" />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Note</button>
                                </div>
                            </form>
                        </div>
                    ) : editing ? (
                        <div className="note-editor">
                            <form onSubmit={handleSubmit}>
                                <input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    required
                                    className="note-title-input"
                                />
                                <div className="ai-bar">
                                    <button type="button" className="btn btn-secondary btn-sm" disabled={aiLoading} onClick={() => aiAssist('expand')}>
                                        {aiLoading ? '⏳' : '🔄'} AI Expand
                                    </button>
                                    <button type="button" className="btn btn-secondary btn-sm" disabled={aiLoading} onClick={() => aiAssist('organize')}>
                                        📐 Organize
                                    </button>
                                </div>
                                <textarea
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                    rows={15}
                                    className="note-content-textarea"
                                />
                                <div className="form-group">
                                    <label>Tags</label>
                                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="note-view">
                            <div className="note-view-header">
                                <h2>{selectedNote.title}</h2>
                                <div className="note-view-actions">
                                    <button className="btn btn-ghost btn-sm" onClick={() => togglePin(selectedNote)}>
                                        {selectedNote.is_pinned ? '📌 Unpin' : '📌 Pin'}
                                    </button>
                                    <button className="btn btn-ghost btn-sm" disabled={aiLoading} onClick={() => aiAssist('summarize')}>
                                        {aiLoading ? '⏳' : '📄'} Summarize
                                    </button>
                                    <button className="btn btn-primary btn-sm" onClick={startEdit}>✏️ Edit</button>
                                </div>
                            </div>
                            <div className="note-view-meta">
                                <span>Updated: {new Date(selectedNote.updated_at).toLocaleString()}</span>
                                {selectedNote.tags && <span>Tags: {selectedNote.tags.split(',').map(t => `#${t.trim()}`).join(' ')}</span>}
                            </div>
                            <div className="markdown-content note-rendered">
                                <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
