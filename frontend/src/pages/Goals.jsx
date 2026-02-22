import { useState, useEffect } from 'react';
import { goalsAPI } from '../api/client';
import './Goals.css';

const CATEGORIES = ['daily', 'weekly', 'monthly', 'yearly'];
const STATUSES = ['not_started', 'in_progress', 'completed', 'abandoned'];
const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editGoal, setEditGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        title: '', description: '', category: 'weekly',
        target_date: '', color: '#6366f1', status: 'not_started', progress: 0,
    });

    useEffect(() => { loadGoals(); }, [activeTab]);

    const loadGoals = async () => {
        try {
            const params = activeTab !== 'all' ? { category: activeTab } : {};
            const res = await goalsAPI.list(params);
            setGoals(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...form, progress: Number(form.progress) };
            if (!data.target_date) delete data.target_date;
            if (editGoal) {
                await goalsAPI.update(editGoal.id, data);
            } else {
                await goalsAPI.create(data);
            }
            setShowModal(false);
            setEditGoal(null);
            resetForm();
            loadGoals();
        } catch (err) { console.error(err); }
    };

    const deleteGoal = async (id) => {
        if (!confirm('Delete this goal?')) return;
        await goalsAPI.delete(id);
        loadGoals();
    };

    const openEdit = (goal) => {
        setEditGoal(goal);
        setForm({
            title: goal.title, description: goal.description, category: goal.category,
            target_date: goal.target_date || '', color: goal.color, status: goal.status,
            progress: goal.progress,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setForm({ title: '', description: '', category: 'weekly', target_date: '', color: '#6366f1', status: 'not_started', progress: 0 });
    };

    const updateProgress = async (goal, newProgress) => {
        const status = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started';
        await goalsAPI.update(goal.id, { progress: newProgress, status });
        loadGoals();
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="goals-page">
            <div className="page-header">
                <div>
                    <h1>🎯 Goals</h1>
                    <p>Track your daily, weekly, monthly & yearly goals</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setEditGoal(null); setShowModal(true); }}>
                    + New Goal
                </button>
            </div>

            {/* Category Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
                {CATEGORIES.map(cat => (
                    <button key={cat} className={`tab ${activeTab === cat ? 'active' : ''}`} onClick={() => setActiveTab(cat)}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Goals Grid */}
            {goals.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🎯</div>
                    <h3>No goals yet</h3>
                    <p>Create your first goal to start tracking progress!</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Goal</button>
                </div>
            ) : (
                <div className="goals-grid">
                    {goals.map(goal => (
                        <div key={goal.id} className="glass-card goal-card" style={{ '--goal-color': goal.color }}>
                            <div className="goal-header">
                                <span className="badge badge-primary">{goal.category}</span>
                                <div className="goal-actions">
                                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(goal)}>✏️</button>
                                    <button className="btn btn-ghost btn-icon" onClick={() => deleteGoal(goal.id)}>🗑</button>
                                </div>
                            </div>
                            <h3 className="goal-title">{goal.title}</h3>
                            {goal.description && <p className="goal-desc">{goal.description}</p>}

                            <div className="goal-progress">
                                <div className="progress-header">
                                    <span>{goal.progress.toFixed(0)}%</span>
                                    <span className={`badge badge-${goal.status === 'completed' ? 'success' : goal.status === 'in_progress' ? 'warning' : 'info'}`}>
                                        {goal.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-bar-fill" style={{ width: `${goal.progress}%`, background: goal.color }}></div>
                                </div>
                                <input
                                    type="range" min="0" max="100" value={goal.progress}
                                    onChange={(e) => updateProgress(goal, Number(e.target.value))}
                                    className="progress-slider"
                                />
                            </div>

                            <div className="goal-meta">
                                {goal.target_date && (
                                    <span className="goal-deadline">📅 {new Date(goal.target_date).toLocaleDateString()}</span>
                                )}
                                <span className="goal-tasks">📋 {goal.completed_task_count}/{goal.task_count} tasks</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{editGoal ? 'Edit Goal' : 'New Goal'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g., Learn Python by March" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What do you want to achieve?" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Target Date</label>
                                    <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <div className="color-picker">
                                        {COLORS.map(c => (
                                            <button key={c} type="button" className={`color-dot ${form.color === c ? 'selected' : ''}`}
                                                style={{ background: c }} onClick={() => setForm({ ...form, color: c })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Progress: {form.progress}%</label>
                                <input type="range" min="0" max="100" value={form.progress}
                                    onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editGoal ? 'Update' : 'Create'} Goal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
