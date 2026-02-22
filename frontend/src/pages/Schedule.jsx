import { useState, useEffect, useRef } from 'react';
import { timeBlocksAPI } from '../api/client';
import './Schedule.css';

const CATEGORIES = [
    { val: 'learning', icon: '📚', color: '#6366f1', label: 'Learning' },
    { val: 'building', icon: '🛠️', color: '#8b5cf6', label: 'Building' },
    { val: 'content', icon: '📱', color: '#06b6d4', label: 'Content' },
    { val: 'work', icon: '💼', color: '#f59e0b', label: 'Work' },
    { val: 'meeting', icon: '📞', color: '#ef4444', label: 'Meeting' },
    { val: 'break', icon: '☕', color: '#22c55e', label: 'Break' },
    { val: 'personal', icon: '🏠', color: '#64748b', label: 'Personal' },
];

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

export default function SchedulePage() {
    const [blocks, setBlocks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pomodoroActive, setPomodoroActive] = useState(false);
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 min
    const [pomodoroLabel, setPomodoroLabel] = useState('');
    const timerRef = useRef(null);
    const [form, setForm] = useState({
        date: selectedDate, title: '', category: 'work',
        start_time: '09:00', end_time: '10:00', color: '#6366f1', notes: '',
    });

    useEffect(() => { loadBlocks(); }, [selectedDate]);

    useEffect(() => {
        if (pomodoroActive && pomodoroTime > 0) {
            timerRef.current = setTimeout(() => setPomodoroTime(t => t - 1), 1000);
        } else if (pomodoroTime === 0 && pomodoroActive) {
            setPomodoroActive(false);
            alert('⏰ Pomodoro done! Take a break.');
        }
        return () => clearTimeout(timerRef.current);
    }, [pomodoroActive, pomodoroTime]);

    const loadBlocks = async () => {
        try {
            const res = await timeBlocksAPI.list(selectedDate);
            setBlocks(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const createBlock = async (e) => {
        e.preventDefault();
        const cat = CATEGORIES.find(c => c.val === form.category);
        await timeBlocksAPI.create({ ...form, date: selectedDate, color: cat?.color || '#6366f1' });
        setShowModal(false);
        setForm({ date: selectedDate, title: '', category: 'work', start_time: '09:00', end_time: '10:00', color: '#6366f1', notes: '' });
        loadBlocks();
    };

    const toggleComplete = async (id) => {
        await timeBlocksAPI.complete(id);
        loadBlocks();
    };

    const deleteBlock = async (id) => {
        if (!confirm('Delete this block?')) return;
        await timeBlocksAPI.delete(id);
        loadBlocks();
    };

    const startPomodoro = (title) => {
        setPomodoroLabel(title || 'Focus');
        setPomodoroTime(25 * 60);
        setPomodoroActive(true);
    };

    const stopPomodoro = () => {
        setPomodoroActive(false);
        setPomodoroTime(25 * 60);
    };

    const formatPomTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const getCatInfo = (val) => CATEGORIES.find(c => c.val === val) || CATEGORIES[3];

    // Navigate dates
    const changeDate = (delta) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    // Completed stats
    const totalBlocks = blocks.length;
    const completedBlocks = blocks.filter(b => b.is_completed).length;
    const totalHours = blocks.reduce((sum, b) => {
        const [sh, sm] = b.start_time.split(':').map(Number);
        const [eh, em] = b.end_time.split(':').map(Number);
        return sum + (eh * 60 + em - sh * 60 - sm) / 60;
    }, 0);

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="schedule-page">
            <div className="page-header">
                <div>
                    <h1>🕐 Daily Schedule</h1>
                    <p>Plan your day with time blocks</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Block</button>
                </div>
            </div>

            {/* Date Nav */}
            <div className="date-nav">
                <button className="btn btn-ghost" onClick={() => changeDate(-1)}>← Prev</button>
                <div className="date-display">
                    <h2>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                    <div className="date-stats">
                        <span>{completedBlocks}/{totalBlocks} done</span>
                        <span>•</span>
                        <span>{totalHours.toFixed(1)}h planned</span>
                    </div>
                </div>
                <button className="btn btn-ghost" onClick={() => changeDate(1)}>Next →</button>
            </div>

            {/* Pomodoro Timer */}
            {pomodoroActive && (
                <div className="glass-card pomodoro-bar">
                    <span className="pomodoro-label">🍅 {pomodoroLabel}</span>
                    <span className="pomodoro-time">{formatPomTime(pomodoroTime)}</span>
                    <button className="btn btn-secondary btn-sm" onClick={stopPomodoro}>Stop</button>
                </div>
            )}

            {/* Timeline */}
            <div className="schedule-layout">
                <div className="timeline">
                    {blocks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <div className="icon">🕐</div>
                            <h3>No blocks for this day</h3>
                            <p>Add time blocks to plan your day</p>
                        </div>
                    ) : blocks.map(block => {
                        const cat = getCatInfo(block.category);
                        return (
                            <div key={block.id}
                                className={`time-block ${block.is_completed ? 'completed' : ''}`}
                                style={{ '--block-color': block.color || cat.color }}>
                                <div className="block-time">
                                    <span>{block.start_time.slice(0, 5)}</span>
                                    <span className="block-time-divider">|</span>
                                    <span>{block.end_time.slice(0, 5)}</span>
                                </div>
                                <div className="block-content">
                                    <div className="block-header">
                                        <span className="block-icon">{cat.icon}</span>
                                        <span className="block-title">{block.title}</span>
                                        <span className="badge" style={{ background: cat.color, color: 'white', fontSize: '0.6rem' }}>{cat.label}</span>
                                    </div>
                                    {block.notes && <p className="block-notes">{block.notes}</p>}
                                </div>
                                <div className="block-actions">
                                    <button className="btn btn-ghost btn-sm" onClick={() => toggleComplete(block.id)}>
                                        {block.is_completed ? '✅' : '⬜'}
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => startPomodoro(block.title)}>🍅</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => deleteBlock(block.id)}>🗑</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="schedule-sidebar">
                    <div className="glass-card" style={{ padding: '16px' }}>
                        <h3 style={{ marginBottom: '10px' }}>📊 Category Breakdown</h3>
                        {CATEGORIES.map(cat => {
                            const count = blocks.filter(b => b.category === cat.val).length;
                            if (count === 0) return null;
                            const hours = blocks.filter(b => b.category === cat.val).reduce((sum, b) => {
                                const [sh, sm] = b.start_time.split(':').map(Number);
                                const [eh, em] = b.end_time.split(':').map(Number);
                                return sum + (eh * 60 + em - sh * 60 - sm) / 60;
                            }, 0);
                            return (
                                <div key={cat.val} className="cat-stat">
                                    <span>{cat.icon} {cat.label}</span>
                                    <span style={{ color: cat.color, fontWeight: 700 }}>{hours.toFixed(1)}h</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="glass-card" style={{ padding: '16px', marginTop: '12px' }}>
                        <h3 style={{ marginBottom: '10px' }}>🍅 Pomodoro</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click 🍅 on any block to start a 25 min focus timer</p>
                        {!pomodoroActive && (
                            <button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}
                                onClick={() => startPomodoro('General Focus')}>
                                Start Focus Session
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Add Time Block</h2>
                        <form onSubmit={createBlock}>
                            <div className="form-group">
                                <label>Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g., Learn FastAPI, Build feature" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.icon} {c.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Start</label>
                                    <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>End</label>
                                    <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Block</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
