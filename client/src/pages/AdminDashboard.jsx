import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, UserCheck, Calendar, MessageSquare, Droplet } from 'lucide-react';
import AdminUsers from '../components/admin/AdminUsers';
import AdminOfficials from '../components/admin/AdminOfficials';
import AdminPrograms from '../components/admin/AdminPrograms';
import AdminPosts from '../components/admin/AdminPosts';

// Reusing the Blood Donation Search component within the new structure
import { API_URL } from '../api';
import { Search } from 'lucide-react';

function BloodDonationSearch() {
    const [bloodGroup, setBloodGroup] = useState('');
    const [donors, setDonors] = useState([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearching(true);
        try {
            const query = bloodGroup ? `?blood_group=${encodeURIComponent(bloodGroup)}` : '';
            const res = await fetch(`${API_URL}/admin/donors${query}`);
            const data = await res.json();
            setDonors(data);
        } catch (err) {
            console.error(err);
        }
        setSearching(false);
    };

    return (
        <div>
            <div className="surface-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 className="headline-small" style={{ marginBottom: '1.5rem' }}>Find Donors</h2>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', maxWidth: '600px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <select className="input" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                            <option value="">All Blood Groups</option>
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
                    <button type="submit" className="btn btn-primary" disabled={searching}>
                        <Search size={18} /> Search
                    </button>
                </form>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {donors.map(donor => (
                    <div key={donor.id} className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'hsl(var(--md-sys-color-surface-container))' }}>
                        <div>
                            <strong className="body-large">{donor.name}</strong><br />
                            <span className="body-medium" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>{donor.email} | {donor.phone}</span>
                        </div>
                        <span className="title-large" style={{ color: 'hsl(var(--md-sys-color-tertiary))' }}>{donor.blood_group}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    if (!user || user.is_admin !== 1) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Access Denied</div>;

    const tabs = [
        { id: 'users', label: 'Users', icon: <Users size={18} /> },
        { id: 'officials', label: 'Officials', icon: <UserCheck size={18} /> },
        { id: 'programs', label: 'Programs', icon: <Calendar size={18} /> },
        { id: 'posts', label: 'News Feed', icon: <MessageSquare size={18} /> },
        { id: 'blood', label: 'Blood Bank', icon: <Droplet size={18} /> },
    ];

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            <h1 className="display-small" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', color: 'hsl(var(--md-sys-color-primary))' }}>
                <Shield size={40} /> Admin Dashboard
            </h1>

            <div style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                marginBottom: '2rem',
                borderBottom: '1px solid hsl(var(--md-sys-color-outline))',
                paddingBottom: '0.5rem'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="label-large"
                        style={{
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: activeTab === tab.id ? 'hsl(var(--md-sys-color-primary))' : 'hsl(var(--md-sys-color-on-surface-variant))',
                            borderBottom: activeTab === tab.id ? '2px solid hsl(var(--md-sys-color-primary))' : '2px solid transparent',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="animate-fade-in">
                {activeTab === 'users' && <AdminUsers />}
                {activeTab === 'officials' && <AdminOfficials />}
                {activeTab === 'programs' && <AdminPrograms />}
                {activeTab === 'posts' && <AdminPosts />}
                {activeTab === 'blood' && <BloodDonationSearch />}
            </div>
        </div>
    );
}
