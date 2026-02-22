import { useState, useEffect } from 'react';
import { tasksAPI, goalsAPI, aiAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';
import './Tasks.css';

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'optional'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);
    const [calendarData, setCalendarData] = useState({});
    const [viewDate, setViewDate] = useState(new Date());
    const [view, setView] = useState('list'); // list | calendar | priority
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiResult, setAiResult] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [form, setForm] = useState({
        title: '', description: '', goal_id: '', priority: 'medium',
        due_date: '', due_time: '', estimated_minutes: '', category: 'general',
        is_recurring: false, recurrence_pattern: '',
    });

    useEffect(() => { loadData(); }, [filterStatus]);
    useEffect(() => { if (view === 'calendar') loadCalendar(); }, [viewDate, view]);

    const loadData = async () => {
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            const [tasksRes, goalsRes] = await Promise.all([
                tasksAPI.list(params),
                goalsAPI.list(),
            ]);
            setTasks(tasksRes.data);
            setGoals(goalsRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadCalendar = async () => {
        try {
            const res = await tasksAPI.calendar(viewDate.getFullYear(), viewDate.getMonth() + 1);
            setCalendarData(res.data.tasks || {});
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...form };
            if (!data.goal_id) delete data.goal_id; else data.goal_id = Number(data.goal_id);
            if (!data.due_date) delete data.due_date;
            if (!data.due_time) delete data.due_time;
            if (data.estimated_minutes) data.estimated_minutes = Number(data.estimated_minutes);
            else delete data.estimated_minutes;
            if (!data.recurrence_pattern) delete data.recurrence_pattern;

            if (editTask) {
                await tasksAPI.update(editTask.id, data);
            } else {
                await tasksAPI.create(data);
            }
            setShowModal(false);
            setEditTask(null);
            resetForm();
            loadData();
            if (view === 'calendar') loadCalendar();
        } catch (err) { console.error(err); }
    };

    const completeTask = async (id) => {
        await tasksAPI.complete(id);
        loadData();
        if (view === 'calendar') loadCalendar();
    };

    const deleteTask = async (id) => {
        if (!confirm('Delete this task?')) return;
        await tasksAPI.delete(id);
        loadData();
        if (view === 'calendar') loadCalendar();
    };

    const openEdit = (task) => {
        setEditTask(task);
        setForm({
            title: task.title, description: task.description,
            goal_id: task.goal_id || '', priority: task.priority,
            due_date: task.due_date || '', due_time: task.due_time || '',
            estimated_minutes: task.estimated_minutes || '',
            category: task.category, is_recurring: task.is_recurring,
            recurrence_pattern: task.recurrence_pattern || '',
        });
        setShowModal(true);
    };

    const openAddForDate = (dateStr) => {
        resetForm();
        setForm(f => ({ ...f, due_date: dateStr }));
        setEditTask(null);
        setShowModal(true);
    };

    const resetForm = () => {
        setForm({
            title: '', description: '', goal_id: '', priority: 'medium',
            due_date: '', due_time: '', estimated_minutes: '', category: 'general',
            is_recurring: false, recurrence_pattern: '',
        });
    };

    const aiPrioritize = async () => {
        setLoadingAI(true);
        try {
            const res = await aiAPI.prioritize('');
            setAiResult(res.data.response);
        } catch (err) {
            setAiResult('⚠️ AI unavailable. Set GROQ_API_KEY in backend .env');
        } finally { setLoadingAI(false); }
    };

    // Calendar helpers
    const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (d) => { const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay(); return first === 0 ? 6 : first - 1; };
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const renderCalendar = () => {
        const days = getDaysInMonth(viewDate);
        const firstDay = getFirstDayOfMonth(viewDate);
        const cells = [];
        const today = new Date().toISOString().split('T')[0];

        for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="cal-cell empty"></div>);

        for (let d = 1; d <= days; d++) {
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayTasks = calendarData[dateStr] || [];
            const isToday = dateStr === today;

            cells.push(
                <div key={d} className={`cal-cell ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                    onClick={() => openAddForDate(dateStr)}>
                    <span className="cal-day">{d}</span>
                    {dayTasks.length > 0 && (
                        <div className="cal-tasks">
                            {dayTasks.slice(0, 3).map((t, i) => (
                                <div key={i} className={`cal-task-dot ${t.status === 'done' ? 'done' : ''}`}
                                    style={{ '--dot-color': t.priority === 'critical' ? '#ef4444' : t.priority === 'high' ? '#f97316' : '#6366f1' }}
                                    title={t.title}>
                                </div>
                            ))}
                            {dayTasks.length > 3 && <span className="cal-more">+{dayTasks.length - 3}</span>}
                        </div>
                    )}
                </div>
            );
        }
        return cells;
    };

    const getPriorityColor = (p) => {
        const map = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', optional: '#64748b' };
        return map[p] || '#6366f1';
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="tasks-page">
            <div className="page-header">
                <div>
                    <h1>📋 Tasks</h1>
                    <p>Manage tasks, schedule on calendar, and get AI prioritization</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={aiPrioritize} disabled={loadingAI}>
                        {loadingAI ? '⏳' : '🤖'} AI Prioritize
                    </button>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setEditTask(null); setShowModal(true); }}>
                        + New Task
                    </button>
                </div>
            </div>

            {/* View Tabs & Filters */}
            <div className="tasks-controls">
                <div className="tabs">
                    <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>📝 List</button>
                    <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>📅 Calendar</button>
                    <button className={`tab ${view === 'priority' ? 'active' : ''}`} onClick={() => setView('priority')}>⚡ Priority</button>
                </div>
                {view === 'list' && (
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '150px' }}>
                        <option value="">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="skipped">Skipped</option>
                    </select>
                )}
            </div>

            {/* AI Prioritization Result */}
            {aiResult && (
                <div className="glass-card ai-result" style={{ padding: '20px', marginBottom: '20px' }}>
                    <div className="section-title">
                        <h2>🤖 AI Task Prioritization</h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAiResult('')}>✕</button>
                    </div>
                    <div className="markdown-content">
                        <ReactMarkdown>{aiResult}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Calendar View */}
            {view === 'calendar' && (
                <div className="glass-card calendar-container">
                    <div className="calendar-header">
                        <button className="btn btn-ghost" onClick={prevMonth}>◀</button>
                        <h2>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                        <button className="btn btn-ghost" onClick={nextMonth}>▶</button>
                    </div>
                    <div className="calendar-grid">
                        {DAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
                        {renderCalendar()}
                    </div>
                </div>
            )}

            {/* List View */}
            {view === 'list' && (
                <div className="tasks-list">
                    {tasks.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📋</div>
                            <h3>No tasks found</h3>
                            <p>Create tasks and assign them to your goals!</p>
                        </div>
                    ) : tasks.map(task => (
                        <div key={task.id} className={`glass-card task-row ${task.status === 'done' ? 'completed' : ''}`}>
                            <button
                                className={`task-check ${task.status === 'done' ? 'checked' : ''}`}
                                onClick={() => task.status !== 'done' && completeTask(task.id)}
                            >
                                {task.status === 'done' ? '✓' : ''}
                            </button>
                            <div className="task-row-info">
                                <span className="task-title">{task.title}</span>
                                <div className="task-meta-row">
                                    {task.goal_title && <span className="task-goal">🎯 {task.goal_title}</span>}
                                    {task.due_date && <span className="task-date">📅 {new Date(task.due_date).toLocaleDateString()}</span>}
                                    {task.estimated_minutes && <span className="task-time">⏱ {task.estimated_minutes}min</span>}
                                </div>
                            </div>
                            <span className="priority-dot" style={{ background: getPriorityColor(task.priority) }} title={task.priority}></span>
                            <div className="task-row-actions">
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(task)}>✏️</button>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteTask(task.id)}>🗑</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Priority View */}
            {view === 'priority' && (
                <div className="priority-grid">
                    {PRIORITIES.map(p => {
                        const filtered = tasks.filter(t => t.priority === p && t.status !== 'done');
                        return (
                            <div key={p} className="glass-card priority-column">
                                <h3 style={{ color: getPriorityColor(p), textTransform: 'capitalize', marginBottom: '12px' }}>
                                    {p === 'critical' ? '🔴' : p === 'high' ? '🟠' : p === 'medium' ? '🟡' : p === 'low' ? '🟢' : '⚪'} {p}
                                    <span className="badge badge-info" style={{ marginLeft: '8px' }}>{filtered.length}</span>
                                </h3>
                                {filtered.map(task => (
                                    <div key={task.id} className="priority-task" onClick={() => openEdit(task)}>
                                        <span>{task.title}</span>
                                        {task.due_date && <span className="task-date">{new Date(task.due_date).toLocaleDateString()}</span>}
                                    </div>
                                ))}
                                {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No tasks</p>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{editTask ? 'Edit Task' : 'New Task'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="What needs to be done?" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Goal (optional)</label>
                                    <select value={form.goal_id} onChange={e => setForm({ ...form, goal_id: e.target.value })}>
                                        <option value="">No goal</option>
                                        {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Due Time</label>
                                    <input type="time" value={form.due_time} onChange={e => setForm({ ...form, due_time: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Est. Minutes</label>
                                    <input type="number" value={form.estimated_minutes} onChange={e => setForm({ ...form, estimated_minutes: e.target.value })} placeholder="e.g., 30" />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., coding" />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editTask ? 'Update' : 'Create'} Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
