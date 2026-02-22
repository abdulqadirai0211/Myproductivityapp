import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, tasksAPI, aiAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [todayTasks, setTodayTasks] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [aiInsight, setAiInsight] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [statsRes, todayRes, overdueRes] = await Promise.all([
                analyticsAPI.dashboard(),
                tasksAPI.today(),
                tasksAPI.overdue(),
            ]);
            setStats(statsRes.data);
            setTodayTasks(todayRes.data);
            setOverdueTasks(overdueRes.data);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const completeTask = async (id) => {
        try {
            await tasksAPI.complete(id);
            loadDashboard();
        } catch (err) {
            console.error('Complete task error:', err);
        }
    };

    const getAIInsight = async () => {
        setLoadingAI(true);
        try {
            const res = await aiAPI.chat('Give me a brief motivational insight and one productivity tip for today based on my stats.');
            setAiInsight(res.data.response);
        } catch (err) {
            setAiInsight('⚠️ AI is unavailable. Make sure your GROQ_API_KEY is set in the backend .env file.');
        } finally {
            setLoadingAI(false);
        }
    };

    if (loading) return <div className="spinner"></div>;

    const today = new Date();
    const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1>{greeting}! 👋</h1>
                    <p>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="page-actions">
                    <Link to="/tasks" className="btn btn-primary">+ Add Task</Link>
                    <Link to="/goals" className="btn btn-secondary">+ New Goal</Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--info-bg)' }}>🎯</div>
                    <div>
                        <div className="stat-value">{stats?.active_goals || 0}</div>
                        <div className="stat-label">Active Goals</div>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>📋</div>
                    <div>
                        <div className="stat-value">{stats?.tasks_completed_today || 0}/{stats?.tasks_today || 0}</div>
                        <div className="stat-label">Today's Tasks</div>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>🔥</div>
                    <div>
                        <div className="stat-value">{stats?.current_streak || 0}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: stats?.tasks_overdue > 0 ? 'var(--danger-bg)' : 'var(--success-bg)' }}>⏰</div>
                    <div>
                        <div className="stat-value">{stats?.tasks_overdue || 0}</div>
                        <div className="stat-label">Overdue</div>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>📈</div>
                    <div>
                        <div className="stat-value">{stats?.weekly_completion_rate?.toFixed(0) || 0}%</div>
                        <div className="stat-label">Weekly Rate</div>
                    </div>
                </div>
            </div>

            <div className="content-grid">
                {/* Today's Tasks */}
                <div className="glass-card" style={{ padding: '20px' }}>
                    <div className="section-title">
                        <h2>📋 Today's Tasks</h2>
                        <Link to="/tasks" className="btn btn-ghost btn-sm">View All</Link>
                    </div>
                    {todayTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="icon">✨</div>
                            <p>No tasks for today. Add some!</p>
                        </div>
                    ) : (
                        <div className="task-list">
                            {todayTasks.map(task => (
                                <div key={task.id} className={`task-item ${task.status === 'done' ? 'completed' : ''}`}>
                                    <button
                                        className={`task-check ${task.status === 'done' ? 'checked' : ''}`}
                                        onClick={() => task.status !== 'done' && completeTask(task.id)}
                                    >
                                        {task.status === 'done' ? '✓' : ''}
                                    </button>
                                    <div className="task-info">
                                        <span className="task-title">{task.title}</span>
                                        {task.goal_title && <span className="task-goal">🎯 {task.goal_title}</span>}
                                    </div>
                                    <span className={`badge badge-${task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'warning' : 'info'}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AI Insights */}
                <div className="glass-card" style={{ padding: '20px' }}>
                    <div className="section-title">
                        <h2>🤖 AI Insight</h2>
                        <button className="btn btn-primary btn-sm" onClick={getAIInsight} disabled={loadingAI}>
                            {loadingAI ? 'Thinking...' : '✨ Get Insight'}
                        </button>
                    </div>
                    {aiInsight ? (
                        <div className="markdown-content ai-response">
                            <ReactMarkdown>{aiInsight}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="icon">🧠</div>
                            <p>Click "Get Insight" for AI-powered productivity tips!</p>
                        </div>
                    )}
                </div>

                {/* Overdue Tasks */}
                {overdueTasks.length > 0 && (
                    <div className="glass-card" style={{ padding: '20px' }}>
                        <div className="section-title">
                            <h2>⚠️ Overdue Tasks</h2>
                            <span className="badge badge-danger">{overdueTasks.length}</span>
                        </div>
                        <div className="task-list">
                            {overdueTasks.slice(0, 5).map(task => (
                                <div key={task.id} className="task-item overdue">
                                    <button className="task-check" onClick={() => completeTask(task.id)}></button>
                                    <div className="task-info">
                                        <span className="task-title">{task.title}</span>
                                        <span className="task-date">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Goals Overview */}
                <div className="glass-card" style={{ padding: '20px' }}>
                    <div className="section-title">
                        <h2>🎯 Goals Overview</h2>
                        <Link to="/goals" className="btn btn-ghost btn-sm">Manage</Link>
                    </div>
                    <div className="goals-summary">
                        {stats?.goals_by_category && Object.entries(stats.goals_by_category).map(([cat, count]) => (
                            <div key={cat} className="goal-cat-item">
                                <span className="goal-cat-label">{cat}</span>
                                <span className="goal-cat-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
