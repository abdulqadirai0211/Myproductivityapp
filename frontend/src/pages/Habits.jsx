import { useState, useEffect } from 'react';
import { habitsAPI, aiAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';
import './Habits.css';

const MOODS = ['😤', '😐', '🙂', '😊', '🔥'];

export default function Habits() {
    const [habits, setHabits] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState(null);
    const [heatmap, setHeatmap] = useState([]);
    const [coachResult, setCoachResult] = useState('');
    const [coachLoading, setCoachLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '', description: '', icon: '✅', color: '#6366f1',
        frequency: 'daily', target_value: 1, unit: 'times',
    });

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => { loadHabits(); }, []);

    const loadHabits = async () => {
        try {
            const res = await habitsAPI.list();
            setHabits(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const createHabit = async (e) => {
        e.preventDefault();
        await habitsAPI.create(form);
        setForm({ name: '', description: '', icon: '✅', color: '#6366f1', frequency: 'daily', target_value: 1, unit: 'times' });
        setShowModal(false);
        loadHabits();
    };

    const toggleHabit = async (habit) => {
        await habitsAPI.checkIn({
            habit_id: habit.id,
            date: today,
            completed: !habit.today_completed,
            value: habit.today_completed ? 0 : habit.target_value,
        });
        loadHabits();
        if (selectedHabit?.id === habit.id) loadHeatmap(habit.id);
    };

    const deleteHabit = async (id) => {
        if (!confirm('Delete this habit?')) return;
        await habitsAPI.delete(id);
        if (selectedHabit?.id === id) { setSelectedHabit(null); setHeatmap([]); }
        loadHabits();
    };

    const loadHeatmap = async (id) => {
        try {
            const res = await habitsAPI.heatmap(id, 90);
            setHeatmap(res.data);
        } catch (e) { console.error(e); }
    };

    const selectHabit = (habit) => {
        setSelectedHabit(habit);
        loadHeatmap(habit.id);
    };

    const getCoaching = async () => {
        setCoachLoading(true);
        try {
            const res = await aiAPI.coach('');
            setCoachResult(res.data.response);
        } catch (e) { setCoachResult('⚠️ AI unavailable. Set GROQ_API_KEY in backend .env'); }
        finally { setCoachLoading(false); }
    };

    // Calculate totals
    const totalCompleted = habits.filter(h => h.today_completed).length;
    const consistency = habits.length > 0 ? Math.round((totalCompleted / habits.length) * 100) : 0;
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.best_streak), 0);

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="habits-page">
            <div className="page-header">
                <div>
                    <h1>🔥 Daily Habits</h1>
                    <p>Build consistency — track your streaks</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={getCoaching} disabled={coachLoading}>
                        {coachLoading ? '⏳' : '🏋️'} Weekly Coach
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Habit</button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card glass-card">
                    <span className="stat-value">{totalCompleted}/{habits.length}</span>
                    <span className="stat-label">Today</span>
                </div>
                <div className="stat-card glass-card">
                    <span className="stat-value">{consistency}%</span>
                    <span className="stat-label">Today's Score</span>
                </div>
                <div className="stat-card glass-card">
                    <span className="stat-value">🔥 {habits.reduce((max, h) => Math.max(max, h.current_streak), 0)}</span>
                    <span className="stat-label">Active Streak</span>
                </div>
                <div className="stat-card glass-card">
                    <span className="stat-value">🏆 {longestStreak}</span>
                    <span className="stat-label">Best Streak</span>
                </div>
            </div>

            {/* Daily Checklist */}
            <div className="habits-layout">
                <div className="habits-checklist glass-card">
                    <h2 style={{ marginBottom: '16px' }}>☀️ Today's Checklist</h2>
                    {habits.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <h3>No habits yet</h3>
                            <p>Add your daily habits like Learning, Building, Posting</p>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Create First Habit</button>
                        </div>
                    ) : (
                        <div className="habit-list">
                            {habits.map(h => (
                                <div key={h.id} className={`habit-row ${h.today_completed ? 'completed' : ''}`}
                                    style={{ '--habit-color': h.color }}>
                                    <button className="habit-check" onClick={() => toggleHabit(h)}>
                                        {h.today_completed ? '✅' : '⬜'}
                                    </button>
                                    <span className="habit-icon">{h.icon}</span>
                                    <div className="habit-info" onClick={() => selectHabit(h)}>
                                        <span className="habit-name">{h.name}</span>
                                        <span className="habit-meta">
                                            {h.target_value} {h.unit} • 🔥 {h.current_streak} day streak
                                        </span>
                                    </div>
                                    <div className="habit-actions">
                                        <span className="habit-streak-badge" style={{ background: h.color }}>
                                            {h.current_streak}d
                                        </span>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteHabit(h.id)}>🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Heatmap / Detail */}
                <div className="habit-detail glass-card">
                    {!selectedHabit ? (
                        <div className="empty-state">
                            <div className="icon">📊</div>
                            <h3>Click a habit to see its heatmap</h3>
                            <p>90-day activity visualization</p>
                        </div>
                    ) : (
                        <>
                            <div className="section-title" style={{ marginBottom: '12px' }}>
                                <h2>{selectedHabit.icon} {selectedHabit.name}</h2>
                                <div>
                                    <span className="badge" style={{ background: selectedHabit.color, color: 'white' }}>
                                        🔥 {selectedHabit.current_streak} streak
                                    </span>
                                    <span className="badge" style={{ background: '#22c55e', color: 'white', marginLeft: '6px' }}>
                                        🏆 {selectedHabit.best_streak} best
                                    </span>
                                </div>
                            </div>
                            {selectedHabit.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>{selectedHabit.description}</p>}

                            <h3 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>📊 90-Day Heatmap</h3>
                            <div className="heatmap-grid">
                                {heatmap.map((day, i) => (
                                    <div key={i}
                                        className={`heatmap-cell ${day.completed ? 'active' : ''}`}
                                        style={day.completed ? { background: selectedHabit.color } : {}}
                                        title={`${day.date}: ${day.completed ? '✅' : '❌'}`}
                                    />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                <span>90 days ago</span>
                                <span>Today</span>
                            </div>

                            <div className="habit-stats-detail" style={{ marginTop: '20px' }}>
                                <div><strong>Total Completions:</strong> {selectedHabit.total_completions}</div>
                                <div><strong>Target:</strong> {selectedHabit.target_value} {selectedHabit.unit}/day</div>
                                <div><strong>Frequency:</strong> {selectedHabit.frequency}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Coach result */}
            {coachResult && (
                <div className="glass-card" style={{ marginTop: '20px', padding: '24px' }}>
                    <h2 style={{ marginBottom: '12px' }}>🏋️ Weekly Coach</h2>
                    <div className="markdown-content">
                        <ReactMarkdown>{coachResult}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>New Habit</h2>
                        <form onSubmit={createHabit}>
                            <div className="form-row">
                                <div className="form-group" style={{ width: '60px' }}>
                                    <label>Icon</label>
                                    <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} maxLength={2} style={{ textAlign: 'center', fontSize: '1.2rem' }} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Name</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Learn 2 hours" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this habit involve?" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Target</label>
                                    <input type="number" min="1" value={form.target_value} onChange={e => setForm({ ...form, target_value: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Unit</label>
                                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                                        {['times', 'hours', 'minutes', 'posts', 'pages', 'tasks'].map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Frequency</label>
                                    <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                                        {['daily', 'weekdays', 'weekly'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
