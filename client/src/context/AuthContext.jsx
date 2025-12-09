import { createContext, useState, useEffect, useContext } from 'react';
import { API_URL } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Check if token is valid and get fresh user data
                    const res = await fetch(`${API_URL}/auth/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const userData = await res.json();
                        setUser(userData);
                        // Update local storage with fresh data
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else {
                        // Token invalid or expired
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                } catch (err) {
                    console.error("Auth check failed:", err);
                    // Fallback to local storage if server unreachable, or clear? 
                    // For security, maybe better to keep local but warn? 
                    // Let's stick to safe behavior: valid header check failing usually means offline or similar.
                    // But if 401/403 it clears. 
                    // For now, if fetch fails (network), we might want to trust local storage temporarily or just do nothing.
                    // Let's rely on the existing local storage as fallback if network error, but update if success.
                    const savedUser = localStorage.getItem('user');
                    if (savedUser) setUser(JSON.parse(savedUser));
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
