import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    return (
        <nav className="glass-panel" style={{ margin: '1rem', padding: '0.75rem 1.5rem', position: 'sticky', top: '1rem', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" style={{ color: 'hsl(var(--md-sys-color-primary))', textDecoration: 'none' }} className="headline-small">
                    Oasis Mathamangalam
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="btn btn-secondary visible-on-mobile"
                    style={{ border: 'none', padding: '0.5rem' }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Desktop Menu */}
                <div className="hide-on-mobile" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/" className="btn btn-secondary" style={{ border: 'none' }}>Home</Link>
                    <Link to="/news" className="btn btn-secondary" style={{ border: 'none' }}>News</Link>
                    <Link to="/officials" className="btn btn-secondary" style={{ border: 'none' }}>Officials</Link>
                    <Link to="/programs" className="btn btn-secondary" style={{ border: 'none' }}>Programs</Link>

                    {user ? (
                        <>
                            <Link to="/dashboard" className="btn btn-secondary">
                                <User size={18} />
                                <span>{user.name}</span>
                            </Link>
                            <button onClick={handleLogout} className="btn btn-primary" aria-label="Logout">
                                <LogOut size={18} />
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary">Login</Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="visible-on-mobile animate-fade-in" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '0.5rem', borderTop: '1px solid hsl(var(--md-sys-color-outline-variant))', paddingTop: '1rem' }}>
                    <Link to="/" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }} onClick={() => setIsMenuOpen(false)}>Home</Link>
                    <Link to="/news" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }} onClick={() => setIsMenuOpen(false)}>News</Link>
                    <Link to="/officials" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }} onClick={() => setIsMenuOpen(false)}>Officials</Link>
                    <Link to="/programs" className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none' }} onClick={() => setIsMenuOpen(false)}>Programs</Link>

                    {user ? (
                        <>
                            <Link to="/dashboard" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => setIsMenuOpen(false)}>
                                <User size={18} />
                                <span>My Profile</span>
                            </Link>
                            <button onClick={handleLogout} className="btn btn-primary" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                                <LogOut size={18} /> Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setIsMenuOpen(false)}>Login</Link>
                    )}
                </div>
            )}
        </nav>
    );
}
