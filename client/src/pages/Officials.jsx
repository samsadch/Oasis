import { useEffect, useState } from 'react';
import { API_URL } from '../api';
import { UserCheck } from 'lucide-react';

export default function Officials() {
    const [year, setYear] = useState('Current');
    const [officials, setOfficials] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/officials?year=${year}`)
            .then(res => res.json())
            .then(data => {
                setOfficials(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [year]);

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1600px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem', alignItems: 'center' }}>
                <h2 className="display-small" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, color: 'hsl(var(--md-sys-color-primary))' }}>
                    <UserCheck size={36} /> Club Officials
                </h2>
                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    background: 'hsl(var(--md-sys-color-surface-container-highest))',
                    padding: '0.25rem',
                    borderRadius: 'var(--md-sys-shape-corner-full)'
                }}>
                    {['Current', '2024', '2023'].map(y => (
                        <button
                            key={y}
                            onClick={() => setYear(y)}
                            className="label-large"
                            style={{
                                padding: '0.5rem 1.5rem',
                                border: 'none',
                                borderRadius: 'var(--md-sys-shape-corner-full)',
                                backgroundColor: year === y ? 'hsl(var(--md-sys-color-secondary-container))' : 'transparent',
                                color: year === y ? 'hsl(var(--md-sys-color-on-secondary-container))' : 'hsl(var(--md-sys-color-on-surface-variant))',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}
                        >
                            {y === 'Current' ? 'Current' : y}
                        </button>
                    ))}
                </div>
            </div>
            {loading ? (
                <p className="body-large" style={{ textAlign: 'center' }}>Loading...</p>
            ) : officials.length > 0 ? (
                <div className="officials-grid">
                    {officials.map(official => (
                        <div key={official.id} className="surface-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                background: 'hsl(var(--md-sys-color-surface-container-highest))',
                                borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                                margin: '0 auto 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                                {official.image_url ? (
                                    <img src={official.image_url} alt={official.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <UserCheck size={40} color="hsl(var(--md-sys-color-on-surface-variant))" />
                                )}
                            </div>
                            <h3 className="headline-small" style={{ marginBottom: '0.5rem' }}>{official.name}</h3>
                            <p className="title-medium" style={{ color: 'hsl(var(--md-sys-color-primary))', marginBottom: '0.5rem' }}>{official.position}</p>
                            <p className="body-medium" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>{official.contact_info}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="body-large" style={{ textAlign: 'center', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>No officials listed for this period.</p>
            )}
        </div>
    );
}
