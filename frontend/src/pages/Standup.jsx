import { useState, useEffect } from 'react';
import { standupsAPI } from '../api/client';
import './Standup.css';

const MOODS = [
    { val: 'frustrated', emoji: '😤', label: 'Frustrated' },
    { val: 'meh', emoji: '😐', label: 'Meh' },
    { val: 'okay', emoji: '🙂', label: 'Okay' },
    { val: 'good', emoji: '😊', label: 'Good' },
    { val: 'great', emoji: '🔥', label: 'On Fire' },
];

export default function StandupPage() {
    const [standup, setStandup] = useState(null);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('morning'); // morning | evening | history
    const [loading, setLoading] = useState(true);
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [todayRes, histRes] = await Promise.all([
                standupsAPI.today(),
                standupsAPI.list(14),
            ]);
            setStandup(todayRes.data);
            setHistory(histRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const saveField = async (field, value) => {
        setStandup(prev => ({ ...prev, [field]: value }));
        await standupsAPI.update(today, { [field]: value });
    };

    const saveNumber = async (field, value) => {
        const num = parseInt(value);
        if (isNaN(num)) return;
        setStandup(prev => ({ ...prev, [field]: num }));
        await standupsAPI.update(today, { [field]: num });
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="standup-page">
            <div className="page-header">
                <div>
                    <h1>☀️ Daily Standup</h1>
                    <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: '20px' }}>
                <button className={`tab ${activeTab === 'morning' ? 'active' : ''}`} onClick={() => setActiveTab('morning')}>☀️ Morning Plan</button>
                <button className={`tab ${activeTab === 'evening' ? 'active' : ''}`} onClick={() => setActiveTab('evening')}>🌙 Evening Reflect</button>
                <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📅 History</button>
            </div>

            {/* Morning Plan */}
            {activeTab === 'morning' && standup && (
                <div className="standup-layout">
                    <div className="glass-card standup-section">
                        <h2>📋 What will I do today?</h2>
                        <textarea
                            className="standup-textarea"
                            value={standup.plan}
                            onChange={e => saveField('plan', e.target.value)}
                            placeholder="Write your plan for today...&#10;&#10;- Learn FastAPI routing for 2 hours&#10;- Build MyTracker income tracker&#10;- Post one LinkedIn article"
                            rows={8}
                        />
                    </div>
                    <div className="glass-card standup-section">
                        <h2>🎯 Top 3 Priorities</h2>
                        <textarea
                            className="standup-textarea"
                            value={standup.top_priorities}
                            onChange={e => saveField('top_priorities', e.target.value)}
                            placeholder="1. Most important task&#10;2. Second priority&#10;3. Third priority"
                            rows={5}
                        />
                        <p className="auto-save-hint">💾 Auto-saves as you type</p>
                    </div>
                </div>
            )}

            {/* Evening Reflection */}
            {activeTab === 'evening' && standup && (
                <div className="standup-layout evening">
                    <div className="glass-card standup-section">
                        <h2>📝 What did I actually do?</h2>
                        <textarea className="standup-textarea" value={standup.reflection}
                            onChange={e => saveField('reflection', e.target.value)}
                            placeholder="Reflect on what you accomplished today..." rows={6} />
                    </div>
                    <div className="glass-card standup-section">
                        <h2>🏆 Wins</h2>
                        <textarea className="standup-textarea" value={standup.wins}
                            onChange={e => saveField('wins', e.target.value)}
                            placeholder="What went well today?" rows={3} />
                    </div>
                    <div className="glass-card standup-section">
                        <h2>🚧 Blockers</h2>
                        <textarea className="standup-textarea" value={standup.blockers}
                            onChange={e => saveField('blockers', e.target.value)}
                            placeholder="What blocked you or slowed you down?" rows={3} />
                    </div>
                    <div className="glass-card standup-section">
                        <h2>🎯 Tomorrow Focus</h2>
                        <textarea className="standup-textarea" value={standup.tomorrow_focus}
                            onChange={e => saveField('tomorrow_focus', e.target.value)}
                            placeholder="What's the #1 thing for tomorrow?" rows={2} />
                    </div>

                    {/* Scores */}
                    <div className="glass-card standup-section scores-section">
                        <h2>📊 Daily Scores</h2>
                        <div className="scores-grid">
                            <div className="score-item">
                                <label>Mood</label>
                                <div className="mood-picker">
                                    {MOODS.map(m => (
                                        <button key={m.val}
                                            className={`mood-btn ${standup.mood === m.val ? 'active' : ''}`}
                                            onClick={() => saveField('mood', m.val)}
                                            title={m.label}>
                                            {m.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="score-item">
                                <label>Energy (1-5): {standup.energy || '-'}</label>
                                <input type="range" min="1" max="5" value={standup.energy || 3}
                                    onChange={e => saveNumber('energy', e.target.value)} />
                            </div>
                            <div className="score-item">
                                <label>Focus (1-10): {standup.focus_score || '-'}</label>
                                <input type="range" min="1" max="10" value={standup.focus_score || 5}
                                    onChange={e => saveNumber('focus_score', e.target.value)} />
                            </div>
                            <div className="score-item">
                                <label>Overall (1-10): {standup.overall_score || '-'}</label>
                                <input type="range" min="1" max="10" value={standup.overall_score || 5}
                                    onChange={e => saveNumber('overall_score', e.target.value)} />
                            </div>
                        </div>
                        <p className="auto-save-hint">💾 Auto-saves as you type</p>
                    </div>
                </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
                <div className="standup-history">
                    {history.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📅</div>
                            <h3>No past standups yet</h3>
                            <p>Start with today's morning plan!</p>
                        </div>
                    ) : history.map(s => (
                        <div key={s.id} className="glass-card history-card">
                            <div className="history-header">
                                <span className="history-date">{new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                <div className="history-scores">
                                    {s.mood && <span>{MOODS.find(m => m.val === s.mood)?.emoji}</span>}
                                    {s.focus_score && <span className="badge">🎯 {s.focus_score}/10</span>}
                                    {s.overall_score && <span className="badge">⭐ {s.overall_score}/10</span>}
                                </div>
                            </div>
                            {s.plan && <div className="history-field"><strong>Plan:</strong> {s.plan.slice(0, 120)}{s.plan.length > 120 ? '...' : ''}</div>}
                            {s.wins && <div className="history-field"><strong>Wins:</strong> {s.wins.slice(0, 100)}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
