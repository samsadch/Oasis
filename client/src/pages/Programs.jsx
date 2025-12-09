import { useEffect, useState } from 'react';
import { API_URL } from '../api';
import { Calendar } from 'lucide-react';

export default function Programs() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch events
        fetch(`${API_URL}/events`)
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="container animate-fade-in" style={{ padding: '3rem 1rem', maxWidth: '800px' }}>
            <h1 className="headline-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--md-sys-color-primary))', marginBottom: '3rem' }}>
                <Calendar /> Upcoming Programs
            </h1>

            {loading ? (
                <p className="body-medium" style={{ textAlign: 'center' }}>Loading...</p>
            ) : events.length > 0 ? (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {events.map(event => (
                        <div key={event.id} className="surface-card">
                            <h2 className="title-large" style={{ marginBottom: '0.5rem' }}>{event.title}</h2>
                            <p className="label-large" style={{ color: 'hsl(var(--md-sys-color-primary))', marginBottom: '1rem' }}>{event.date}</p>
                            <p className="body-large" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))', lineHeight: 1.6 }}>{event.description}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="surface-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="body-large" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>No upcoming programs at the moment.</p>
                </div>
            )}
        </div>
    );
}
