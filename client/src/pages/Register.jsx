import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', blood_group: '', phone: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                login(data.user, data.token);
                navigate('/');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Something went wrong');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 0' }}>
            <div className="surface-card animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '500px', backgroundColor: 'hsl(var(--md-sys-color-surface-container-high))' }}>
                <h2 className="headline-medium" style={{ textAlign: 'center', marginBottom: '2rem', color: 'hsl(var(--md-sys-color-on-surface))' }}>Join the Club</h2>
                {error && (
                    <div style={{
                        background: 'hsl(var(--md-sys-color-error-container))',
                        color: 'hsl(var(--md-sys-color-on-error-container))',
                        padding: '1rem',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        marginBottom: '1.5rem'
                    }}>
                        <p className="body-medium">{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <input
                        type="text" placeholder="Full Name" className="input"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                    />
                    <input
                        type="email" placeholder="Email" className="input"
                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required
                    />
                    <input
                        type="password" placeholder="Password" className="input"
                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <select
                                className="input"
                                value={formData.blood_group} onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                            >
                                <option value="">Blood Group</option>
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
                        <input
                            type="tel" placeholder="Phone" className="input"
                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Register</button>
                </form>
                <p className="body-medium" style={{ marginTop: '2rem', textAlign: 'center', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>
                    Already a member? <Link to="/login" style={{ color: 'hsl(var(--md-sys-color-primary))', fontWeight: '500' }}>Login</Link>
                </p>
            </div>
        </div>
    );
}
