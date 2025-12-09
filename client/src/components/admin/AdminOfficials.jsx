import { useState, useEffect, useRef } from 'react';
import { API_URL, headers } from '../../api';
import { Edit2, Trash2, Plus, Image as ImageIcon, X } from 'lucide-react';

export default function AdminOfficials() {
    const [officials, setOfficials] = useState([]);
    const [users, setUsers] = useState([]);
    const [year, setYear] = useState('Current');
    const [isEditing, setIsEditing] = useState(false);
    const [creationMode, setCreationMode] = useState('manual'); // 'manual' | 'member'
    const [formData, setFormData] = useState({ name: '', position: '', contact_info: '', display_order: 99, year: 'Current', image_url: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchOfficials();
        fetchUsers();
    }, [year]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/users`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOfficials = async () => {
        try {
            const res = await fetch(`${API_URL}/officials?year=${year}`);
            const data = await res.json();
            setOfficials(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEditing ? `${API_URL}/officials/${isEditing}` : `${API_URL}/officials`;
        const method = isEditing ? 'PUT' : 'POST';

        const data = new FormData();
        data.append('name', formData.name);
        data.append('position', formData.position);
        data.append('contact_info', formData.contact_info);
        data.append('display_order', formData.display_order);
        data.append('year', formData.year);
        if (selectedFile) {
            data.append('image', selectedFile);
        } else if (isEditing && formData.image_url) {
            data.append('image_url', formData.image_url);
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {}, // Let browser set Content-Type
                body: data
            });
            if (res.ok) {
                fetchOfficials();
                setIsEditing(false);
                setFormData({ name: '', position: '', contact_info: '', display_order: 99, year });
                setSelectedFile(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`${API_URL}/officials/${id}`, { method: 'DELETE', headers: headers() });
            fetchOfficials();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditClick = (official) => {
        setIsEditing(official.id);
        setCreationMode('manual'); // Default to manual for editing existing 
        setFormData({ ...official });
        setSelectedFile(null);
    };

    const handleMemberSelect = (userId) => {
        const user = users.find(u => u.id === parseInt(userId));
        if (user) {
            setFormData({
                ...formData,
                name: user.name,
                contact_info: user.phone || '',
                image_url: user.image_url || ''
            });
            // If user has an image, we can optionally try to fetch it or just use the URL
            // Since our backend stores full URLs or simple paths, relying on image_url string is safest for now
            setSelectedFile(null);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <select className="input" value={year} onChange={e => { setYear(e.target.value); setFormData({ ...formData, year: e.target.value }) }} style={{ maxWidth: '200px' }}>
                    <option value="Current">Current Committee</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                </select>
                <button onClick={() => { setIsEditing(false); setFormData({ name: '', position: '', contact_info: '', display_order: 99, year }); setSelectedFile(null); }} className="btn btn-primary">
                    <Plus size={18} /> Add Official
                </button>
            </div>

            <form onSubmit={handleSubmit} className="surface-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <h3 style={{ gridColumn: 'span 2', marginBottom: '0.5rem' }}>{isEditing ? 'Edit Official' : 'Add New Official'}</h3>

                {!isEditing && (
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginBottom: '1rem', background: 'hsl(var(--md-sys-color-surface-container-highest))', padding: '0.5rem', borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
                        <button
                            type="button"
                            onClick={() => setCreationMode('manual')}
                            className={creationMode === 'manual' ? 'btn btn-primary' : 'btn'}
                            style={{ flex: 1, height: '36px' }}
                        >
                            Manual Entry
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreationMode('member')}
                            className={creationMode === 'member' ? 'btn btn-primary' : 'btn'}
                            style={{ flex: 1, height: '36px' }}
                        >
                            Select Member
                        </button>
                    </div>
                )}

                {creationMode === 'member' && !isEditing && (
                    <div style={{ gridColumn: 'span 2' }}>
                        <select
                            className="input"
                            onChange={(e) => handleMemberSelect(e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>Select a member...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} (ID: {u.membership_id || 'N/A'})</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <ImageIcon size={20} /> {selectedFile ? 'Change Image' : (formData.image_url ? 'Change Image' : 'Upload Image')}
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
                    {!selectedFile && formData.image_url && (
                        <img src={formData.image_url} alt="Current" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                </div>

                <input placeholder="Name" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                <input placeholder="Position" className="input" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} required />
                <input placeholder="Phone / Contact" className="input" value={formData.contact_info} onChange={e => setFormData({ ...formData, contact_info: e.target.value })} />
                <input type="number" placeholder="Order (1=Top)" className="input" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: e.target.value })} />

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Save'}</button>
                    {isEditing && <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>}
                </div>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {officials.map(official => (
                    <div key={official.id} className="surface-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {official.image_url && <img src={official.image_url} alt={official.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />}
                            <div>
                                <strong>{official.name}</strong> <span style={{ color: 'hsl(var(--primary))' }}>({official.position})</span>
                                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Order: {official.display_order} | Year: {official.year}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEditClick(official)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(official.id)} className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ff6666' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
