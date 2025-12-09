import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, headers } from '../../api';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => {
        fetchUsers();
    }, [filter, sortBy]);

    const fetchUsers = async () => {
        const query = new URLSearchParams();
        if (filter) query.append('blood_group', filter);
        if (sortBy) query.append('sort_by', sortBy);

        try {
            const res = await fetch(`${API_URL}/admin/users?${query.toString()}`, { headers: headers() });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error('Failed to fetch users:', data);
                setUsers([]); // Fallback to empty array to prevent crash
            }
        } catch (err) {
            console.error(err);
            setUsers([]);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`${API_URL}/admin/users/${id}/approve`, {
                method: 'PUT',
                headers: headers()
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRoleToggle = async (user) => {
        if (!confirm(`Are you sure you want to ${user.is_admin ? 'demote' : 'promote'} ${user.name}?`)) return;
        try {
            const res = await fetch(`${API_URL}/admin/users/${user.id}/role`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ is_admin: user.is_admin ? 0 : 1 })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getRoleBadge = (isAdmin) => {
        if (isAdmin) {
            return <span className="label-small" style={{ backgroundColor: 'hsl(var(--md-sys-color-primary))', color: 'hsl(var(--md-sys-color-on-primary))', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Admin</span>;
        }
        return <span className="label-small" style={{ backgroundColor: 'hsl(var(--md-sys-color-secondary-container))', color: 'hsl(var(--md-sys-color-on-secondary-container))', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>User</span>;
    };

    const getStatusBadge = (isApproved) => {
        if (isApproved) {
            return <span className="label-small" style={{ color: 'hsl(var(--md-sys-color-primary))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span> Active</span>;
        }
        return <span className="label-small" style={{ color: 'hsl(var(--md-sys-color-error))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span> Pending</span>;
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '200px' }}>
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
                <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ maxWidth: '200px' }}>
                    <option value="name">Sort by Name</option>
                    <option value="blood_group">Sort by Blood Group</option>
                </select>
            </div>

            <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead style={{ backgroundColor: 'hsl(var(--md-sys-color-surface-container-high))' }}>
                            <tr>
                                <th className="label-large" style={{ padding: '1rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>User Info</th>
                                <th className="label-large" style={{ padding: '1rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Email</th>
                                <th className="label-large" style={{ padding: '1rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Phone</th>
                                <th className="label-large" style={{ padding: '1rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Blood Group</th>
                                <th className="label-large" style={{ padding: '1rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Role</th>
                                <th className="label-large" style={{ padding: '1rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>Status</th>
                                <th className="label-large" style={{ padding: '1rem', color: 'hsl(var(--md-sys-color-on-surface-variant))', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id} style={{
                                    borderBottom: index < users.length - 1 ? '1px solid hsl(var(--md-sys-color-outline-variant))' : 'none',
                                    backgroundColor: user.is_approved ? 'transparent' : 'hsla(var(--md-sys-color-error-container) / 0.1)'
                                }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'hsl(var(--md-sys-color-primary-container))', color: 'hsl(var(--md-sys-color-on-primary-container))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                                                {user.image_url ? (
                                                    <img src={user.image_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <Link to={`/admin/users/${user.id}`} className="body-large" style={{ fontWeight: 500, textDecoration: 'none', color: 'inherit' }}>
                                                    {user.name}
                                                </Link>
                                                {user.membership_id && <div className="label-small" style={{ color: 'hsl(var(--md-sys-color-primary))', marginTop: '2px' }}>ID: {user.membership_id}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="body-medium" style={{ color: 'hsl(var(--md-sys-color-on-surface))' }}>{user.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="body-medium" style={{ color: 'hsl(var(--md-sys-color-on-surface))' }}>{user.phone || '-'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className="label-medium" style={{ fontWeight: 'bold', color: 'hsl(var(--md-sys-color-tertiary))' }}>{user.blood_group || '-'}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {getRoleBadge(user.is_admin)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {getStatusBadge(user.is_approved)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {!user.is_approved && (
                                                <button
                                                    onClick={() => handleApprove(user.id)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', height: '32px' }}
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRoleToggle(user)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', height: '32px' }}
                                            >
                                                {user.is_admin ? 'Demote' : 'Promote'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>
                            No users found matching filter.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
