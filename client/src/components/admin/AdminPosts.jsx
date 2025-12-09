import { useState, useEffect, useRef } from 'react';
import { API_URL, headers } from '../../api';
import { Plus, Send, Image as ImageIcon, X } from 'lucide-react';

export default function AdminPosts() {
    const [posts, setPosts] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/posts`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (selectedFile) {
            formData.append('image', selectedFile);
        }

        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                fetchPosts();
                setTitle('');
                setContent('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create post');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="surface-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 className="headline-small" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={24} /> Create New Post
                </h3>

                <input
                    placeholder="Post Title"
                    className="input"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ marginBottom: '1rem', width: '100%' }}
                />

                <textarea
                    placeholder="What's happening?"
                    className="input"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={{ minHeight: '120px', marginBottom: '1rem', width: '100%', fontFamily: 'inherit' }}
                    required
                />

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <ImageIcon size={20} /> {selectedFile ? 'Change Image' : 'Upload Image'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={e => setSelectedFile(e.target.files[0])}
                        accept="image/*"
                    />
                    {selectedFile && (
                        <span className="label-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {selectedFile.name}
                            <button type="button" onClick={() => { setSelectedFile(null); fileInputRef.current.value = ''; }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--md-sys-color-error))' }}>
                                <X size={16} />
                            </button>
                        </span>
                    )}
                </div>

                <button type="submit" className="btn btn-primary"><Send size={18} /> Post</button>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {posts.map(post => (
                    <div key={post.id} className="surface-card" style={{ padding: '1.5rem' }}>
                        {post.title && <h4 className="title-medium" style={{ marginBottom: '0.5rem' }}>{post.title}</h4>}
                        <p style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                        {post.image_url && <img src={post.image_url} alt="Post" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--md-sys-shape-corner-medium)', marginBottom: '1rem' }} />}
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                            Posted: {new Date(post.created_at).toLocaleDateString()} | Likes: {post.like_count}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
