import { useState, useEffect } from 'react';
import { categoriesAPI, contentAPI, aiAPI } from '../api/client';
import ReactMarkdown from 'react-markdown';
import './Categories.css';

const DEFAULT_CATEGORIES = [
    { name: 'Learning', icon: '📚', color: '#6366f1', description: 'Break down what you are learning' },
    { name: 'Building', icon: '🛠️', color: '#8b5cf6', description: 'Track products you are building' },
    { name: 'Content Creation', icon: '📱', color: '#06b6d4', description: 'Track LinkedIn, Medium, Reels posts' },
];

const PLATFORMS = ['linkedin', 'medium', 'reel', 'twitter', 'youtube', 'other'];
const CONTENT_TYPES = ['post', 'article', 'reel', 'video', 'thread', 'tutorial'];
const CONTENT_STATUSES = ['idea', 'drafting', 'scheduled', 'published'];

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null);
    const [contentPosts, setContentPosts] = useState([]);
    const [activeView, setActiveView] = useState('categories'); // categories | content | suggest
    const [showCatModal, setShowCatModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editPost, setEditPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiResult, setAiResult] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', icon: '📂', color: '#6366f1', description: '' });
    const [itemForm, setItemForm] = useState({
        category_id: '', title: '', description: '', status: 'active',
        phase: '', eta: '', progress: 0, parent_id: null,
    });
    const [contentForm, setContentForm] = useState({
        platform: 'linkedin', title: '', content_type: 'post',
        topic: '', status: 'idea', published_date: '', url: '', notes: '',
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [catRes, postsRes] = await Promise.all([
                categoriesAPI.list(),
                contentAPI.list(),
            ]);
            setCategories(catRes.data);
            setContentPosts(postsRes.data);
            if (catRes.data.length > 0 && !selectedCat) setSelectedCat(catRes.data[0]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Seed defaults
    const seedDefaults = async () => {
        for (const cat of DEFAULT_CATEGORIES) {
            try { await categoriesAPI.create(cat); } catch (e) { /* already exists */ }
        }
        loadData();
    };

    // Category CRUD
    const createCategory = async (e) => {
        e.preventDefault();
        await categoriesAPI.create(catForm);
        setCatForm({ name: '', icon: '📂', color: '#6366f1', description: '' });
        setShowCatModal(false);
        loadData();
    };

    const deleteCategory = async (id) => {
        if (!confirm('Delete this category and all its items?')) return;
        await categoriesAPI.delete(id);
        if (selectedCat?.id === id) setSelectedCat(null);
        loadData();
    };

    // Category Item CRUD
    const submitItem = async (e) => {
        e.preventDefault();
        const data = { ...itemForm, category_id: selectedCat.id };
        if (!data.phase) delete data.phase;
        if (!data.eta) delete data.eta;
        if (!data.parent_id) delete data.parent_id;
        data.progress = Number(data.progress);

        if (editItem) {
            await categoriesAPI.updateItem(editItem.id, data);
        } else {
            await categoriesAPI.createItem(data);
        }
        setShowItemModal(false);
        setEditItem(null);
        setItemForm({ category_id: '', title: '', description: '', status: 'active', phase: '', eta: '', progress: 0, parent_id: null });
        loadData();
    };

    const openEditItem = (item) => {
        setEditItem(item);
        setItemForm({
            category_id: item.category_id, title: item.title, description: item.description,
            status: item.status, phase: item.phase || '', eta: item.eta || '',
            progress: item.progress, parent_id: item.parent_id,
        });
        setShowItemModal(true);
    };

    const deleteItem = async (id) => {
        if (!confirm('Delete this item?')) return;
        await categoriesAPI.deleteItem(id);
        loadData();
    };

    const updateItemProgress = async (item, newProgress) => {
        const status = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'active' : 'active';
        await categoriesAPI.updateItem(item.id, { progress: newProgress, status });
        loadData();
    };

    // Content CRUD
    const submitContent = async (e) => {
        e.preventDefault();
        const data = { ...contentForm };
        if (!data.published_date) delete data.published_date;
        if (!data.url) delete data.url;

        if (editPost) {
            await contentAPI.update(editPost.id, data);
        } else {
            await contentAPI.create(data);
        }
        setShowContentModal(false);
        setEditPost(null);
        setContentForm({ platform: 'linkedin', title: '', content_type: 'post', topic: '', status: 'idea', published_date: '', url: '', notes: '' });
        loadData();
    };

    const openEditPost = (post) => {
        setEditPost(post);
        setContentForm({
            platform: post.platform, title: post.title, content_type: post.content_type,
            topic: post.topic, status: post.status, published_date: post.published_date || '',
            url: post.url || '', notes: post.notes,
        });
        setShowContentModal(true);
    };

    const deletePost = async (id) => {
        if (!confirm('Delete this post?')) return;
        await contentAPI.delete(id);
        loadData();
    };

    // AI Content Suggestions
    const getContentSuggestions = async () => {
        setAiLoading(true);
        try {
            const res = await aiAPI.contentSuggest('');
            setAiResult(res.data.response);
            setActiveView('suggest');
        } catch (err) {
            setAiResult('⚠️ AI unavailable. Set GROQ_API_KEY in backend .env');
        } finally { setAiLoading(false); }
    };

    const platformIcon = (p) => {
        const map = { linkedin: '💼', medium: '✍️', reel: '🎬', twitter: '🐦', youtube: '▶️', other: '📄' };
        return map[p] || '📄';
    };

    const statusColor = (s) => {
        const map = { idea: '#64748b', drafting: '#eab308', scheduled: '#6366f1', published: '#22c55e', active: '#6366f1', completed: '#22c55e', paused: '#f97316', archived: '#64748b' };
        return map[s] || '#6366f1';
    };

    if (loading) return <div className="spinner"></div>;

    // Refresh selected category from latest data
    const currentCat = categories.find(c => c.id === selectedCat?.id);

    return (
        <div className="categories-page">
            <div className="page-header">
                <div>
                    <h1>📂 Categories & Content</h1>
                    <p>Organize learning, building, content creation & more</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={getContentSuggestions} disabled={aiLoading}>
                        {aiLoading ? '⏳' : '🤖'} Suggest Posts
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCatModal(true)}>+ Add Category</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: '20px' }}>
                <button className={`tab ${activeView === 'categories' ? 'active' : ''}`} onClick={() => setActiveView('categories')}>📂 Categories</button>
                <button className={`tab ${activeView === 'content' ? 'active' : ''}`} onClick={() => setActiveView('content')}>📱 Content Tracker</button>
                <button className={`tab ${activeView === 'suggest' ? 'active' : ''}`} onClick={() => setActiveView('suggest')}>🤖 AI Suggestions</button>
            </div>

            {/* Categories View */}
            {activeView === 'categories' && (
                <div className="categories-layout">
                    {/* Category Sidebar */}
                    <div className="cat-list">
                        {categories.length === 0 ? (
                            <div className="empty-state" style={{ padding: '20px' }}>
                                <h3>No categories yet</h3>
                                <p>Start with defaults?</p>
                                <button className="btn btn-primary btn-sm" onClick={seedDefaults}>
                                    🚀 Create Defaults
                                </button>
                            </div>
                        ) : categories.map(cat => (
                            <div key={cat.id}
                                className={`cat-tab ${currentCat?.id === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCat(cat)}
                                style={{ '--cat-color': cat.color }}>
                                <span className="cat-icon">{cat.icon}</span>
                                <div className="cat-tab-info">
                                    <span className="cat-tab-name">{cat.name}</span>
                                    <span className="cat-tab-count">{cat.items?.length || 0} items</span>
                                </div>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}>🗑</button>
                            </div>
                        ))}
                    </div>

                    {/* Category Items */}
                    <div className="cat-content glass-card">
                        {!currentCat ? (
                            <div className="empty-state">
                                <div className="icon">📂</div>
                                <h3>Select a category</h3>
                                <p>Or create one to start organizing your work</p>
                            </div>
                        ) : (
                            <>
                                <div className="section-title" style={{ marginBottom: '16px' }}>
                                    <h2>{currentCat.icon} {currentCat.name}</h2>
                                    <button className="btn btn-primary btn-sm" onClick={() => { setEditItem(null); setItemForm({ ...itemForm, category_id: currentCat.id }); setShowItemModal(true); }}>+ Add Item</button>
                                </div>
                                {currentCat.description && <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.85rem' }}>{currentCat.description}</p>}

                                {(!currentCat.items || currentCat.items.length === 0) ? (
                                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                                        <p>No items yet. Add your first item!</p>
                                    </div>
                                ) : (
                                    <div className="items-list">
                                        {currentCat.items.filter(i => !i.parent_id).map(item => (
                                            <div key={item.id} className="cat-item" style={{ '--item-color': currentCat.color }}>
                                                <div className="cat-item-header">
                                                    <div className="cat-item-info">
                                                        <span className="cat-item-title">{item.title}</span>
                                                        <div className="cat-item-meta">
                                                            <span className="badge" style={{ background: statusColor(item.status), color: 'white', fontSize: '0.65rem' }}>{item.status}</span>
                                                            {item.phase && <span className="cat-item-phase">📋 {item.phase}</span>}
                                                            {item.eta && <span className="cat-item-eta">📅 {new Date(item.eta).toLocaleDateString()}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="cat-item-actions">
                                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditItem(item)}>✏️</button>
                                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteItem(item.id)}>🗑</button>
                                                    </div>
                                                </div>
                                                {item.description && <p className="cat-item-desc">{item.description}</p>}

                                                {/* Progress */}
                                                <div className="cat-item-progress">
                                                    <div className="progress-bar">
                                                        <div className="progress-bar-fill" style={{ width: `${item.progress}%`, background: currentCat.color }}></div>
                                                    </div>
                                                    <span>{item.progress.toFixed(0)}%</span>
                                                </div>
                                                <input type="range" min="0" max="100" value={item.progress}
                                                    onChange={(e) => updateItemProgress(item, Number(e.target.value))}
                                                    className="progress-slider" style={{ marginTop: '4px' }} />

                                                {/* Sub-items */}
                                                {item.children && item.children.length > 0 && (
                                                    <div className="sub-items">
                                                        {item.children.map(sub => (
                                                            <div key={sub.id} className="sub-item">
                                                                <span className={sub.status === 'completed' ? 'completed-text' : ''}>{sub.title}</span>
                                                                <div className="sub-item-right">
                                                                    {sub.phase && <span className="sub-phase">{sub.phase}</span>}
                                                                    <span className="badge" style={{ background: statusColor(sub.status), color: 'white', fontSize: '0.6rem' }}>{sub.status}</span>
                                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteItem(sub.id)}>✕</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Quick add sub-item */}
                                                <button className="btn btn-ghost btn-sm add-sub"
                                                    onClick={() => {
                                                        setEditItem(null);
                                                        setItemForm({ category_id: currentCat.id, title: '', description: '', status: 'active', phase: '', eta: '', progress: 0, parent_id: item.id });
                                                        setShowItemModal(true);
                                                    }}>
                                                    + Add sub-item
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Content Tracker View */}
            {activeView === 'content' && (
                <div>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={() => { setEditPost(null); setShowContentModal(true); }}>+ New Post</button>
                    </div>

                    {contentPosts.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📱</div>
                            <h3>No content posts tracked yet</h3>
                            <p>Start tracking your LinkedIn, Medium, and Reel posts!</p>
                        </div>
                    ) : (
                        <div className="content-grid">
                            {['linkedin', 'medium', 'reel', 'twitter', 'youtube'].map(platform => {
                                const posts = contentPosts.filter(p => p.platform === platform);
                                if (posts.length === 0) return null;
                                return (
                                    <div key={platform} className="glass-card content-section">
                                        <h3 style={{ marginBottom: '12px' }}>{platformIcon(platform)} {platform.charAt(0).toUpperCase() + platform.slice(1)}</h3>
                                        {posts.map(post => (
                                            <div key={post.id} className="content-post-item">
                                                <div className="content-post-header">
                                                    <span className="content-post-title">{post.title}</span>
                                                    <span className="badge" style={{ background: statusColor(post.status), color: 'white' }}>{post.status}</span>
                                                </div>
                                                {post.topic && <span className="content-post-topic">📌 {post.topic}</span>}
                                                <div className="content-post-actions">
                                                    {post.url && <a href={post.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">🔗 Link</a>}
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openEditPost(post)}>✏️</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => deletePost(post.id)}>🗑</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* AI Suggestions View */}
            {activeView === 'suggest' && (
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <button className="btn btn-primary" onClick={getContentSuggestions} disabled={aiLoading}>
                            {aiLoading ? '⏳ Generating...' : '🤖 Get Today\'s Content Ideas'}
                        </button>
                    </div>
                    {aiResult ? (
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div className="markdown-content">
                                <ReactMarkdown>{aiResult}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="icon">🤖</div>
                            <h3>AI Content Suggestions</h3>
                            <p>Get daily post ideas for LinkedIn, Medium, and Reels based on your learnings and AI/ML trends.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Category Modal */}
            {showCatModal && (
                <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>New Category</h2>
                        <form onSubmit={createCategory}>
                            <div className="form-row">
                                <div className="form-group" style={{ width: '60px' }}>
                                    <label>Icon</label>
                                    <input value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })} maxLength={2} style={{ textAlign: 'center', fontSize: '1.2rem' }} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Name</label>
                                    <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} required placeholder="e.g., Learning, Building" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} placeholder="What does this category track?" />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Item Modal */}
            {showItemModal && (
                <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{editItem ? 'Edit Item' : itemForm.parent_id ? 'Add Sub-Item' : 'Add Item'}</h2>
                        <form onSubmit={submitItem}>
                            <div className="form-group">
                                <label>Title</label>
                                <input value={itemForm.title} onChange={e => setItemForm({ ...itemForm, title: e.target.value })} required placeholder="e.g., FastAPI, MyTracker MVP" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} rows={2} placeholder="Details..." />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={itemForm.status} onChange={e => setItemForm({ ...itemForm, status: e.target.value })}>
                                        {['active', 'completed', 'paused', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Phase</label>
                                    <input value={itemForm.phase} onChange={e => setItemForm({ ...itemForm, phase: e.target.value })} placeholder="e.g., Phase 2 - MVP" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>ETA</label>
                                    <input type="date" value={itemForm.eta} onChange={e => setItemForm({ ...itemForm, eta: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Progress: {itemForm.progress}%</label>
                                    <input type="range" min="0" max="100" value={itemForm.progress}
                                        onChange={e => setItemForm({ ...itemForm, progress: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Content Post Modal */}
            {showContentModal && (
                <div className="modal-overlay" onClick={() => setShowContentModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>{editPost ? 'Edit Post' : 'Track New Post'}</h2>
                        <form onSubmit={submitContent}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Platform</label>
                                    <select value={contentForm.platform} onChange={e => setContentForm({ ...contentForm, platform: e.target.value })}>
                                        {PLATFORMS.map(p => <option key={p} value={p}>{platformIcon(p)} {p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select value={contentForm.content_type} onChange={e => setContentForm({ ...contentForm, content_type: e.target.value })}>
                                        {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Title</label>
                                <input value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} required placeholder="Post title or headline" />
                            </div>
                            <div className="form-group">
                                <label>Topic</label>
                                <input value={contentForm.topic} onChange={e => setContentForm({ ...contentForm, topic: e.target.value })} placeholder="e.g., LangChain Agents, Python Tips" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={contentForm.status} onChange={e => setContentForm({ ...contentForm, status: e.target.value })}>
                                        {CONTENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Published Date</label>
                                    <input type="date" value={contentForm.published_date} onChange={e => setContentForm({ ...contentForm, published_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>URL</label>
                                <input value={contentForm.url} onChange={e => setContentForm({ ...contentForm, url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea value={contentForm.notes} onChange={e => setContentForm({ ...contentForm, notes: e.target.value })} rows={2} placeholder="Any extra notes..." />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowContentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editPost ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
