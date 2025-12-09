import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Shield, Droplet, User, Edit2, Save, X as XIcon, Image as ImageIcon } from 'lucide-react';
import { API_URL, headers } from '../api';

export default function Dashboard() {
    const { user, login } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        blood_group: user?.blood_group || '',
        image_url: user?.image_url || ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    if (!user) return <div className="container" style={{ padding: '2rem' }}>Please login first.</div>;

    const handleSave = async () => {
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('phone', formData.phone);
            data.append('blood_group', formData.blood_group);
            if (selectedFile) {
                data.append('image', selectedFile);
            } else {
                data.append('image_url', formData.image_url);
            }

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });
            const resData = await res.json();
            if (res.ok) {
                login(resData.user, token);
                setIsEditing(false);
                setSelectedFile(null);
            } else {
                alert(resData.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update profile');
        }
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 0', maxWidth: '800px' }}>
            <h1 className="display-medium" style={{ marginBottom: '2rem', color: 'hsl(var(--md-sys-color-primary))' }}>Hello, {user.name}</h1>

            <div className="surface-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="headline-medium">My Profile</h2>
                    {!isEditing ? (
                        <button onClick={() => {
                            setFormData({
                                name: user.name,
                                phone: user.phone || '',
                                blood_group: user.blood_group || '',
                                image_url: user.image_url || ''
                            });
                            setIsEditing(true);
                            setSelectedFile(null);
                        }} className="btn btn-secondary">
                            <Edit2 size={18} /> Edit
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={handleSave} className="btn btn-primary"><Save size={18} /> Save</button>
                            <button onClick={() => { setIsEditing(false); setSelectedFile(null); }} className="btn btn-secondary"><XIcon size={18} /> Cancel</button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                            background: 'hsl(var(--md-sys-color-surface-container-high))',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid hsl(var(--md-sys-color-outline-variant))',
                            flexShrink: 0,
                            position: 'relative'
                        }}>
                            {selectedFile ? (
                                <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (formData.image_url || user.image_url ? (
                                <img src={isEditing ? formData.image_url : user.image_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={48} color="hsl(var(--md-sys-color-on-surface-variant))" />
                            ))}
                        </div>
                        {isEditing && (
                            <div style={{ flex: 1, minWidth: '200px', width: '100%' }}>
                                <label className="label-medium" style={{ display: 'block', marginBottom: '0.5rem' }}>Profile Image</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <ImageIcon size={18} /> {selectedFile ? 'Change Image' : 'Upload Image'}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                    />
                                    {selectedFile && <span className="body-medium">{selectedFile.name}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, auto) 1fr', gap: '1rem', alignItems: 'center' }}>
                            <span className="label-large" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Name</span>
                            {isEditing ? (
                                <input type="text" className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            ) : (
                                <span className="body-large">{user.name}</span>
                            )}

                            <span className="label-large" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Email</span>
                            <span className="body-large" style={{ wordBreak: 'break-all' }}>{user.email}</span>

                            <span className="label-large" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Phone</span>
                            {isEditing ? (
                                <input type="tel" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            ) : (
                                <span className="body-large">{user.phone || '-'}</span>
                            )}

                            <span className="label-large" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Blood Group</span>
                            {isEditing ? (
                                <div style={{ position: 'relative' }}>
                                    <select className="input" value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                            ) : (
                                <span className="title-large" style={{ color: 'hsl(var(--md-sys-color-primary))' }}>{user.blood_group || '-'}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {user.is_admin === 1 && (
                <div className="surface-card" style={{
                    backgroundColor: 'hsl(var(--md-sys-color-secondary-container))',
                    color: 'hsl(var(--md-sys-color-on-secondary-container))'
                }}>
                    <h2 className="headline-small" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Shield /> Admin Control Center
                    </h2>
                    <p className="body-medium" style={{ marginBottom: '1.5rem' }}>Manage club activities and blood donations.</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/admin" className="btn btn-primary" style={{ backgroundColor: 'hsl(var(--md-sys-color-on-secondary-container))', color: 'hsl(var(--md-sys-color-secondary-container))' }}>
                            <Droplet size={18} /> Open Admin Dashboard
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
