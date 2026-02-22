import { useState, useEffect } from 'react';
import { incomeAPI } from '../api/client';
import './Income.css';

const CATEGORIES = ['freelance', 'job', 'passive', 'content', 'product', 'other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export default function IncomePage() {
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState(null);
    const [goals, setGoals] = useState([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview | entries | goals
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [entryForm, setEntryForm] = useState({
        source: '', description: '', amount: '', currency: 'INR',
        date: new Date().toISOString().split('T')[0], category: 'freelance',
        is_recurring: false, client: '', notes: '',
    });
    const [goalForm, setGoalForm] = useState({
        title: '', target_amount: '', currency: 'INR', period: 'monthly',
        start_date: '', end_date: '',
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [eRes, sRes, gRes] = await Promise.all([
                incomeAPI.entries({}),
                incomeAPI.summary(),
                incomeAPI.goals(),
            ]);
            setEntries(eRes.data);
            setSummary(sRes.data);
            setGoals(gRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const createEntry = async (e) => {
        e.preventDefault();
        const data = { ...entryForm, amount: Number(entryForm.amount) };
        if (!data.client) delete data.client;
        await incomeAPI.createEntry(data);
        setShowEntryModal(false);
        setEntryForm({ source: '', description: '', amount: '', currency: 'INR', date: new Date().toISOString().split('T')[0], category: 'freelance', is_recurring: false, client: '', notes: '' });
        loadData();
    };

    const createGoal = async (e) => {
        e.preventDefault();
        await incomeAPI.createGoal({ ...goalForm, target_amount: Number(goalForm.target_amount) });
        setShowGoalModal(false);
        setGoalForm({ title: '', target_amount: '', currency: 'INR', period: 'monthly', start_date: '', end_date: '' });
        loadData();
    };

    const deleteEntry = async (id) => {
        if (!confirm('Delete this entry?')) return;
        await incomeAPI.deleteEntry(id);
        loadData();
    };

    const deleteGoal = async (id) => {
        if (!confirm('Delete this goal?')) return;
        await incomeAPI.deleteGoal(id);
        loadData();
    };

    const formatMoney = (amt, curr = 'INR') => {
        if (curr === 'INR') return `₹${Number(amt).toLocaleString('en-IN')}`;
        return `${curr} ${Number(amt).toLocaleString()}`;
    };

    const catIcon = (c) => {
        const map = { freelance: '💼', job: '🏢', passive: '📈', content: '📱', product: '🚀', other: '📦' };
        return map[c] || '📦';
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="income-page">
            <div className="page-header">
                <div>
                    <h1>💰 Income Tracker</h1>
                    <p>Track earnings, set goals, grow wealth</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={() => setShowGoalModal(true)}>🎯 Set Goal</button>
                    <button className="btn btn-primary" onClick={() => setShowEntryModal(true)}>+ Add Income</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: '20px' }}>
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
                <button className={`tab ${activeTab === 'entries' ? 'active' : ''}`} onClick={() => setActiveTab('entries')}>📝 Entries</button>
                <button className={`tab ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}>🎯 Goals</button>
            </div>

            {/* Overview */}
            {activeTab === 'overview' && summary && (
                <div>
                    <div className="stats-row">
                        <div className="stat-card glass-card">
                            <span className="stat-value">{formatMoney(summary.total_this_month)}</span>
                            <span className="stat-label">This Month</span>
                        </div>
                        <div className="stat-card glass-card">
                            <span className="stat-value">{formatMoney(summary.total_this_year)}</span>
                            <span className="stat-label">This Year</span>
                        </div>
                        <div className="stat-card glass-card">
                            <span className="stat-value">{entries.length}</span>
                            <span className="stat-label">Total Entries</span>
                        </div>
                    </div>

                    {/* By Category */}
                    <div className="income-grid" style={{ marginTop: '20px' }}>
                        <div className="glass-card" style={{ padding: '20px' }}>
                            <h3 style={{ marginBottom: '12px' }}>📊 By Category</h3>
                            {Object.keys(summary.by_category).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No income data yet</p>
                            ) : (
                                <div className="income-breakdown">
                                    {Object.entries(summary.by_category).map(([cat, amt]) => (
                                        <div key={cat} className="breakdown-item">
                                            <span>{catIcon(cat)} {cat}</span>
                                            <span className="breakdown-amount">{formatMoney(amt)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="glass-card" style={{ padding: '20px' }}>
                            <h3 style={{ marginBottom: '12px' }}>📈 Monthly Trend</h3>
                            <div className="trend-chart">
                                {summary.monthly_trend.map((m, i) => {
                                    const maxAmt = Math.max(...summary.monthly_trend.map(t => t.amount), 1);
                                    const height = (m.amount / maxAmt) * 100;
                                    return (
                                        <div key={i} className="trend-bar-wrap">
                                            <div className="trend-bar" style={{ height: `${Math.max(height, 4)}%` }}></div>
                                            <span className="trend-label">{m.month.split('-')[1]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Entries */}
            {activeTab === 'entries' && (
                <div className="entries-list">
                    {entries.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">💰</div>
                            <h3>No income entries yet</h3>
                            <p>Start tracking your earnings!</p>
                        </div>
                    ) : entries.map(e => (
                        <div key={e.id} className="glass-card entry-card">
                            <div className="entry-main">
                                <span className="entry-icon">{catIcon(e.category)}</span>
                                <div className="entry-info">
                                    <span className="entry-source">{e.source}</span>
                                    {e.description && <span className="entry-desc">{e.description}</span>}
                                    {e.client && <span className="entry-client">👤 {e.client}</span>}
                                </div>
                                <div className="entry-right">
                                    <span className="entry-amount">{formatMoney(e.amount, e.currency)}</span>
                                    <span className="entry-date">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteEntry(e.id)}>🗑</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Goals */}
            {activeTab === 'goals' && (
                <div>
                    {goals.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">🎯</div>
                            <h3>No income goals yet</h3>
                            <p>Set targets to track your progress!</p>
                        </div>
                    ) : (
                        <div className="goals-grid">
                            {goals.map(g => (
                                <div key={g.id} className="glass-card goal-card">
                                    <div className="goal-header">
                                        <h3>{g.title}</h3>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteGoal(g.id)}>🗑</button>
                                    </div>
                                    <div className="goal-target">
                                        <span className="goal-current">{formatMoney(g.current_amount, g.currency)}</span>
                                        <span className="goal-divider">/</span>
                                        <span className="goal-total">{formatMoney(g.target_amount, g.currency)}</span>
                                    </div>
                                    <div className="progress-bar" style={{ marginTop: '10px' }}>
                                        <div className="progress-bar-fill"
                                            style={{ width: `${Math.min(g.progress, 100)}%`, background: g.progress >= 100 ? '#22c55e' : 'var(--accent-primary)' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span>{g.progress.toFixed(1)}%</span>
                                        <span>{g.period}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Entry Modal */}
            {showEntryModal && (
                <div className="modal-overlay" onClick={() => setShowEntryModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Add Income</h2>
                        <form onSubmit={createEntry}>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Source</label>
                                    <input value={entryForm.source} onChange={e => setEntryForm({ ...entryForm, source: e.target.value })} required placeholder="e.g., Upwork, Freelance" />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={entryForm.category} onChange={e => setEntryForm({ ...entryForm, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{catIcon(c)} {c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Amount</label>
                                    <input type="number" value={entryForm.amount} onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })} required placeholder="50000" />
                                </div>
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select value={entryForm.currency} onChange={e => setEntryForm({ ...entryForm, currency: e.target.value })}>
                                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={entryForm.date} onChange={e => setEntryForm({ ...entryForm, date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Client (optional)</label>
                                <input value={entryForm.client} onChange={e => setEntryForm({ ...entryForm, client: e.target.value })} placeholder="Client name" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })} placeholder="What was this for?" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEntryModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Income</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Goal Modal */}
            {showGoalModal && (
                <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Set Income Goal</h2>
                        <form onSubmit={createGoal}>
                            <div className="form-group">
                                <label>Title</label>
                                <input value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} required placeholder="e.g., ₹1L/month by June" />
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Target Amount</label>
                                    <input type="number" value={goalForm.target_amount} onChange={e => setGoalForm({ ...goalForm, target_amount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Period</label>
                                    <select value={goalForm.period} onChange={e => setGoalForm({ ...goalForm, period: e.target.value })}>
                                        {['monthly', 'quarterly', 'yearly'].map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" value={goalForm.start_date} onChange={e => setGoalForm({ ...goalForm, start_date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" value={goalForm.end_date} onChange={e => setGoalForm({ ...goalForm, end_date: e.target.value })} required />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Set Goal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
