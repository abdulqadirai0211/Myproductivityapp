import { useState, useEffect } from 'react';
import { analyticsAPI, aiAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';
import './Analytics.css';

export default function Analytics() {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [dailyLogs, setDailyLogs] = useState([]);
    const [activeSection, setActiveSection] = useState('overview'); // overview | reports | analyze | research
    const [aiResult, setAiResult] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [logForm, setLogForm] = useState({
        date: new Date().toISOString().split('T')[0],
        productivity_score: 5, mood: 'good', energy_level: 3,
        focus_hours: 0, notes: '',
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [reportsRes, logsRes] = await Promise.all([
                analyticsAPI.weeklyReports(10),
                analyticsAPI.dailyLogs({ limit: 14 }),
            ]);
            setReports(reportsRes.data);
            setDailyLogs(logsRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const generateReport = async () => {
        setAiLoading(true);
        try {
            const res = await aiAPI.report('');
            setAiResult(res.data.response);
            loadData();
        } catch (err) {
            setAiResult('⚠️ AI unavailable. Set GROQ_API_KEY in backend .env');
        } finally { setAiLoading(false); }
    };

    const analyzeProductivity = async () => {
        setAiLoading(true);
        try {
            const res = await aiAPI.analyze('');
            setAiResult(res.data.response);
        } catch (err) {
            setAiResult('⚠️ AI unavailable. Set GROQ_API_KEY in backend .env');
        } finally { setAiLoading(false); }
    };

    const researchIncome = async () => {
        setAiLoading(true);
        try {
            const res = await aiAPI.research('');
            setAiResult(res.data.response);
        } catch (err) {
            setAiResult('⚠️ AI unavailable. Set GROQ_API_KEY in backend .env');
        } finally { setAiLoading(false); }
    };

    const saveDailyLog = async () => {
        try {
            await analyticsAPI.createDailyLog({
                ...logForm,
                productivity_score: Number(logForm.productivity_score),
                energy_level: Number(logForm.energy_level),
                focus_hours: Number(logForm.focus_hours),
            });
            loadData();
            alert('Daily log saved!');
        } catch (err) { console.error(err); }
    };

    const moodEmoji = (mood) => {
        const map = { great: '😄', good: '🙂', okay: '😐', bad: '😟', terrible: '😢' };
        return map[mood] || '🙂';
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1>📈 Analytics & AI</h1>
                    <p>Reports, productivity analysis, and income research</p>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="tabs" style={{ marginBottom: '24px' }}>
                <button className={`tab ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => setActiveSection('overview')}>📊 Overview</button>
                <button className={`tab ${activeSection === 'reports' ? 'active' : ''}`} onClick={() => setActiveSection('reports')}>📋 Reports</button>
                <button className={`tab ${activeSection === 'analyze' ? 'active' : ''}`} onClick={() => setActiveSection('analyze')}>🧠 Analyze</button>
                <button className={`tab ${activeSection === 'research' ? 'active' : ''}`} onClick={() => setActiveSection('research')}>💰 Research</button>
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && (
                <div className="overview-section">
                    {/* Daily Log */}
                    <div className="glass-card log-card" style={{ padding: '24px', marginBottom: '20px' }}>
                        <h2 style={{ marginBottom: '16px' }}>📝 Daily Log</h2>
                        <div className="log-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Productivity ({logForm.productivity_score}/10)</label>
                                    <input type="range" min="0" max="10" value={logForm.productivity_score}
                                        onChange={e => setLogForm({ ...logForm, productivity_score: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Mood</label>
                                    <select value={logForm.mood} onChange={e => setLogForm({ ...logForm, mood: e.target.value })}>
                                        {['great', 'good', 'okay', 'bad', 'terrible'].map(m => (
                                            <option key={m} value={m}>{moodEmoji(m)} {m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Energy Level ({logForm.energy_level}/5)</label>
                                    <input type="range" min="1" max="5" value={logForm.energy_level}
                                        onChange={e => setLogForm({ ...logForm, energy_level: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Focus Hours</label>
                                    <input type="number" min="0" max="24" step="0.5" value={logForm.focus_hours}
                                        onChange={e => setLogForm({ ...logForm, focus_hours: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button className="btn btn-primary" onClick={saveDailyLog}>Save Log</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} rows={2}
                                    placeholder="How was your day? What did you learn?" />
                            </div>
                        </div>
                    </div>

                    {/* Recent Logs */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h2 style={{ marginBottom: '16px' }}>📅 Recent Daily Logs</h2>
                        {dailyLogs.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No logs yet. Start logging your daily progress!</p>
                        ) : (
                            <div className="logs-list">
                                {dailyLogs.map(log => (
                                    <div key={log.id} className="log-item">
                                        <span className="log-date">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        <span className="log-mood">{moodEmoji(log.mood)}</span>
                                        <div className="log-score">
                                            <div className="mini-bar">
                                                <div className="mini-bar-fill" style={{ width: `${(log.productivity_score || 0) * 10}%` }}></div>
                                            </div>
                                            <span>{log.productivity_score}/10</span>
                                        </div>
                                        <span className="log-focus">⏱ {log.focus_hours}h</span>
                                        <span className="log-tasks">✅ {log.tasks_completed}/{log.tasks_total}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reports Section */}
            {activeSection === 'reports' && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <button className="btn btn-primary" onClick={generateReport} disabled={aiLoading}>
                            {aiLoading ? '⏳ Generating...' : '📊 Generate Weekly Report'}
                        </button>
                    </div>
                    {aiResult && (
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
                            <h2 style={{ marginBottom: '16px' }}>📊 Latest Report</h2>
                            <div className="markdown-content">
                                <ReactMarkdown>{aiResult}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                    <div className="reports-list">
                        {reports.map(report => (
                            <div key={report.id} className="glass-card report-item" onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}>
                                <div className="report-header">
                                    <h3>Week: {new Date(report.week_start).toLocaleDateString()} — {new Date(report.week_end).toLocaleDateString()}</h3>
                                    <span className="badge badge-primary">{selectedReport?.id === report.id ? 'Close' : 'View'}</span>
                                </div>
                                {selectedReport?.id === report.id && (
                                    <div className="markdown-content" style={{ marginTop: '16px' }}>
                                        <ReactMarkdown>{report.report_content || report.insights}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ))}
                        {reports.length === 0 && (
                            <div className="empty-state">
                                <div className="icon">📊</div>
                                <h3>No reports yet</h3>
                                <p>Generate your first weekly report using AI!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Analyze Section */}
            {activeSection === 'analyze' && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <button className="btn btn-primary" onClick={analyzeProductivity} disabled={aiLoading}>
                            {aiLoading ? '⏳ Analyzing...' : '🧠 Analyze My Productivity'}
                        </button>
                    </div>
                    {aiResult && (
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div className="markdown-content">
                                <ReactMarkdown>{aiResult}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {!aiResult && (
                        <div className="empty-state">
                            <div className="icon">🧠</div>
                            <h3>AI Productivity Analysis</h3>
                            <p>Click the button above to get AI-powered analysis of your patterns, weaknesses, and improvement suggestions.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Research Section */}
            {activeSection === 'research' && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <button className="btn btn-primary" onClick={researchIncome} disabled={aiLoading}>
                            {aiLoading ? '⏳ Researching...' : '💰 Research Income Opportunities'}
                        </button>
                    </div>
                    {aiResult && (
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div className="markdown-content">
                                <ReactMarkdown>{aiResult}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {!aiResult && (
                        <div className="empty-state">
                            <div className="icon">💰</div>
                            <h3>Income & Learning Research</h3>
                            <p>AI will analyze your skills and goals to suggest earning opportunities, learning paths, and side project ideas.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
