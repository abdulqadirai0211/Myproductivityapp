import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/tasks', label: 'Tasks', icon: '📋' },
    { path: '/notes', label: 'Notes', icon: '📝' },
    { path: '/categories', label: 'Categories', icon: '📂' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">⚡</div>
                <div>
                    <h1 className="brand-name">MyTracker</h1>
                    <p className="brand-tagline">AI Productivity</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="ai-badge">
                    <span className="ai-dot"></span>
                    AI Powered by Groq
                </div>
            </div>
        </aside>
    );
}
