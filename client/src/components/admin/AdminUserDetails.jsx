import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, headers } from '../../api';
import { User, ArrowLeft, Save, Trash2, Mail, Phone, Droplet, Shield } from 'lucide-react';

export default function AdminUserDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        blood_group: '',
        membership_id: '',
        is_approved: 0
    });

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/users/${id}`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setFormData({
                    name: data.name,
                    email: data.email,
                    phone: data.phone || '',
                    blood_group: data.blood_group || '',
                    membership_id: data.membership_id || '',
                    is_approved: data.is_approved
                });
            } else {
                alert('User not found');
                navigate('/admin');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'PUT',
                headers: {
                    ...headers(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('User updated successfully');
                fetchUser();
            } else {
                const err = await res.json();
                alert('Failed to update: ' + err.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error updating user');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone.')) return;

        try {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: headers()
            });

            if (res.ok) {
                alert('User deleted');
                navigate('/admin');
            } else {
                alert('Failed to delete user');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;
    if (!user) return null;

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 0', maxWidth: '800px' }}>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
                <ArrowLeft size={18} /> Back to Users
            </button>

            <div className="surface-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '80px', height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'hsl(var(--md-sys-color-primary-container))',
                        color: 'hsl(var(--md-sys-color-on-primary-container))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '2rem',
                        overflow: 'hidden'
                    }}>
                        {user.image_url ? (
                            <img src={user.image_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h1 className="headline-medium">{user.name}</h1>
                        <p className="body-medium" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>
                            Member since {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                        {user.is_admin === 1 && <span className="label-medium" style={{ backgroundColor: 'hsl(var(--md-sys-color-primary))', color: 'hsl(var(--md-sys-color-on-primary))', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>Admin</span>}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>

                    <div className="input-group">
                        <label className="label-medium" style={{ marginBottom: '0.5rem', display: 'block' }}>Full Name</label>
                        <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label-medium" style={{ marginBottom: '0.5rem', display: 'block' }}>Email</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Mail size={18} color="hsl(var(--md-sys-color-outline))" />
                                <input className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="label-medium" style={{ marginBottom: '0.5rem', display: 'block' }}>Phone</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Phone size={18} color="hsl(var(--md-sys-color-outline))" />
                                <input className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label-medium" style={{ marginBottom: '0.5rem', display: 'block' }}>Blood Group</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Droplet size={18} color="hsl(var(--md-sys-color-tertiary))" />
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
                        </div>
                        <div>
                            <label className="label-medium" style={{ marginBottom: '0.5rem', display: 'block' }}>Membership ID</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Shield size={18} color="hsl(var(--md-sys-color-outline))" />
                                <input className="input" value={formData.membership_id} onChange={e => setFormData({ ...formData, membership_id: e.target.value })} placeholder="Not assigned" />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', borderTop: '1px solid hsl(var(--md-sys-color-outline-variant))', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <button onClick={handleDelete} className="btn" style={{ color: 'hsl(var(--md-sys-color-error))' }}>
                            <Trash2 size={18} /> Delete User
                        </button>
                        <button onClick={handleSave} className="btn btn-primary">
                            <Save size={18} /> Save Changes
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
