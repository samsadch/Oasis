import { useState, useEffect } from 'react';
import { API_URL, headers } from '../../api';
import { Plus, Edit2 } from 'lucide-react';

export default function AdminPrograms() {
    const [events, setEvents] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', date: '', active: 1 });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API_URL}/events`);
            const data = await res.json();
            setEvents(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEditing ? `${API_URL}/events/${isEditing}` : `${API_URL}/events`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: headers(),
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchEvents();
                setIsEditing(false);
                setFormData({ title: '', description: '', date: '', active: 1 });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
                <button onClick={() => { setIsEditing(false); setFormData({ title: '', description: '', date: '', active: 1 }); }} className="btn btn-primary">
                    <Plus size={18} /> Add Program
                </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <h3 style={{ gridColumn: 'span 2', marginBottom: '0.5rem' }}>{isEditing ? 'Edit Program' : 'Add New Program'}</h3>
                <input placeholder="Title" className="input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={{ gridColumn: 'span 2' }} />
                <textarea placeholder="Description" className="input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ gridColumn: 'span 2', minHeight: '100px' }} />
                <input type="date" className="input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                <select className="input" value={formData.active} onChange={e => setFormData({ ...formData, active: parseInt(e.target.value) })}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                </select>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Save'}</button>
                    {isEditing && <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>}
                </div>
            </form>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {events.map(event => (
                    <div key={event.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong>{event.title}</strong>
                            <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>{event.date} | {event.active ? 'Active' : 'Inactive'}</div>
                        </div>
                        <button onClick={() => { setIsEditing(event.id); setFormData(event); }} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}
