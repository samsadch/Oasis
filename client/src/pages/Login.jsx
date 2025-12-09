import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
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
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="surface-card animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px', backgroundColor: 'hsl(var(--md-sys-color-surface-container-high))' }}>
                <h2 className="headline-medium" style={{ textAlign: 'center', marginBottom: '2rem', color: 'hsl(var(--md-sys-color-on-surface))' }}>Welcome Back</h2>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                            type="password"
                            placeholder="Password"
                            className="input"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Login</button>
                </form>
                <p className="body-medium" style={{ marginTop: '2rem', textAlign: 'center', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'hsl(var(--md-sys-color-primary))', fontWeight: '500' }}>Register</Link>
                </p>
            </div>
        </div>
    );
}
