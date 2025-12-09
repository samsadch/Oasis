import { useEffect, useState, useRef } from 'react';
import { API_URL, headers } from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, Send, Trash2, Edit2, X, Image as ImageIcon } from 'lucide-react';

export default function NewsPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Admin State
    const [isCreating, setIsCreating] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [postForm, setPostForm] = useState({ title: '', content: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // Comments State
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [comments, setComments] = useState({}); // Map post_id -> comments array
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/posts`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSavePost = async (e) => {
        e.preventDefault();
        const url = editingPost ? `${API_URL}/posts/${editingPost.id}` : `${API_URL}/posts`;
        const method = editingPost ? 'PUT' : 'POST';

        const formData = new FormData();
        formData.append('title', postForm.title);
        formData.append('content', postForm.content);
        if (selectedFile) {
            formData.append('image', selectedFile);
        } else if (editingPost && editingPost.image_url) {
            // Logic to keep existing image (handled by backend usually if not provided)
            // But we can append old one as string if API expects it, normally API keeps old if new not sent
            formData.append('image_url', editingPost.image_url);
        }

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type to multipart/form-data manually, browser does it
                },
                body: formData
            });
            if (res.ok) {
                fetchPosts();
                setIsCreating(false);
                setEditingPost(null);
                setPostForm({ title: '', content: '' });
                setSelectedFile(null);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save post');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            const res = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: headers()
            });
            if (res.ok) {
                setPosts(posts.filter(p => p.id !== postId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLike = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to like');

        try {
            const res = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Optimistic update
                fetchPosts();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/comments`);
            const data = await res.json();
            setComments(prev => ({ ...prev, [postId]: data }));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleComments = (postId) => {
        if (activeCommentPostId === postId) {
            setActiveCommentPostId(null);
        } else {
            setActiveCommentPostId(postId);
            if (!comments[postId]) {
                fetchComments(postId);
            }
        }
    };

    const handleCommentLike = async (commentId, postId) => {
        const token = localStorage.getItem('token');
        if (!token) return alert('Please login to like comments');

        try {
            const res = await fetch(`${API_URL}/posts/comments/${commentId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchComments(postId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostComment = async (postId) => {
        if (!newComment.trim()) return;
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ content: newComment })
            });
            const data = await res.json();
            if (res.ok) {
                setComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), data]
                }));
                setNewComment('');
                setPosts(posts.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '3rem 1rem', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 className="headline-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--md-sys-color-primary))', margin: 0 }}>
                    <MessageSquare /> News Feed
                </h1>
                {user?.is_admin === 1 && (
                    <button
                        onClick={() => { setIsCreating(true); setEditingPost(null); setPostForm({ title: '', content: '' }); setSelectedFile(null); }}
                        className="btn btn-primary"
                    >
                        <Edit2 size={18} /> New Post
                    </button>
                )}
            </div>

            {/* Create/Edit Modal or Inline Form */}
            {(isCreating || editingPost) && (
                <div className="surface-card" style={{ marginBottom: '3rem', border: '1px solid hsl(var(--md-sys-color-outline-variant))', padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 className="title-large">{editingPost ? 'Edit Post' : 'Create Post'}</h3>
                        <button onClick={() => { setIsCreating(false); setEditingPost(null); }} className="btn btn-secondary" style={{ border: 'none', padding: '0.5rem' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Post Title"
                            value={postForm.title}
                            onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                        />
                        <textarea
                            className="input"
                            placeholder="What's happening?"
                            value={postForm.content}
                            onChange={e => setPostForm({ ...postForm, content: e.target.value })}
                            style={{ minHeight: '120px', height: 'auto', paddingTop: '1rem', fontFamily: 'inherit' }}
                            required
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <ImageIcon size={20} /> {selectedFile ? selectedFile.name : (editingPost?.image_url ? 'Change Image' : 'Upload Image')}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={e => setSelectedFile(e.target.files[0])}
                                accept="image/*"
                            />
                            {editingPost?.image_url && !selectedFile && (
                                <span className="label-medium" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Current image will be kept if not changed.</span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">
                                <Send size={18} /> {editingPost ? 'Update' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Posts List */}
            {loading ? (
                <p style={{ textAlign: 'center' }}>Loading...</p>
            ) : (
                <div style={{ display: 'grid', gap: '3rem' }}>
                    {posts.map(post => (
                        <div key={post.id} className="surface-card" style={{ padding: '0', overflow: 'hidden' }}>

                            {/* Minimalist Header */}
                            <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                                {post.title && <h2 className="headline-small" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{post.title}</h2>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>
                                    <span className="label-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                                    {user?.is_admin === 1 && (
                                        <>
                                            <span>•</span>
                                            <button
                                                onClick={() => { setEditingPost(post); setPostForm({ title: post.title || '', content: post.content }); setSelectedFile(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                style={{ color: 'inherit', padding: '0 0.25rem' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                style={{ color: 'hsl(var(--md-sys-color-error))', padding: '0 0.25rem' }}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Image (Prominent - Full Width) */}
                            {post.image_url && (
                                <div style={{
                                    width: '100%',
                                    maxHeight: '500px',
                                    overflow: 'hidden',
                                    marginBottom: '0',
                                    backgroundColor: 'hsl(var(--md-sys-color-surface-container))'
                                }}>
                                    <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </div>
                            )}

                            {/* Content (Description) */}
                            <div style={{ padding: '1.5rem' }}>
                                <p className="body-large" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>{post.content}</p>
                            </div>

                            {/* Actions Bar (Minimalist) */}
                            <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid hsl(var(--md-sys-color-outline-variant))', padding: '1rem 1.5rem' }}>
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className="btn"
                                    style={{
                                        padding: 0,
                                        color: post.user_liked ? 'hsl(var(--md-sys-color-error))' : 'hsl(var(--md-sys-color-on-surface-variant))',
                                        gap: '0.5rem',
                                        background: 'transparent'
                                    }}
                                >
                                    <Heart size={20} fill={post.user_liked ? "currentColor" : "none"} /> {post.like_count || 0}
                                </button>
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="btn"
                                    style={{
                                        padding: 0,
                                        color: 'hsl(var(--md-sys-color-on-surface-variant))',
                                        gap: '0.5rem',
                                        background: 'transparent'
                                    }}
                                >
                                    <MessageSquare size={20} /> {post.comment_count || 0}
                                </button>
                            </div>

                            {/* Comments Section */}
                            {activeCommentPostId === post.id && (
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid hsl(var(--md-sys-color-outline-variant))', background: 'hsl(var(--md-sys-color-surface-container-low))' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem', paddingTop: '1.5rem' }}>
                                        {comments[post.id]?.length > 0 ? (
                                            comments[post.id].map(comment => (
                                                <div key={comment.id} style={{ display: 'flex', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px',
                                                        borderRadius: '50%',
                                                        background: 'hsl(var(--md-sys-color-surface-container))',
                                                        overflow: 'hidden', flexShrink: 0
                                                    }}>
                                                        {comment.user_image ? <img src={comment.user_image} alt="" style={{ width: '100%', height: '100%' }} /> : null}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                            <span className="label-medium" style={{ fontWeight: 600 }}>{comment.user_name}</span>
                                                        </div>
                                                        <p className="body-medium" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>{comment.content}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCommentLike(comment.id, post.id)}
                                                        style={{
                                                            color: comment.user_liked ? 'hsl(var(--md-sys-color-error))' : 'hsl(var(--md-sys-color-outline))',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        <Heart size={14} fill={comment.user_liked ? "currentColor" : "none"} />
                                                        {comment.like_count > 0 && <span>{comment.like_count}</span>}
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="body-small" style={{ color: 'hsl(var(--md-sys-color-outline))', fontStyle: 'italic' }}>No comments yet.</p>
                                        )}
                                    </div>

                                    {/* Add Comment */}
                                    {user ? (
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Write a comment..."
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handlePostComment(post.id)}
                                                style={{ height: '40px', borderRadius: '4px', border: 'none', borderBottom: '1px solid hsl(var(--md-sys-color-outline))', background: 'transparent', padding: '0' }}
                                            />
                                            <button
                                                onClick={() => handlePostComment(post.id)}
                                                className="btn"
                                                style={{ width: '40px', height: '40px', padding: 0 }}
                                                disabled={!newComment.trim()}
                                            >
                                                <Send size={20} style={{ color: 'hsl(var(--md-sys-color-primary))' }} />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="body-small">Please login to comment.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
