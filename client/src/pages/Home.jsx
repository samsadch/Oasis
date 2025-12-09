import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 className="display-large" style={{ marginBottom: '1rem', color: 'hsl(var(--md-sys-color-primary))' }}>
                    Oasis Mathamangalam
                </h1>
                <p className="headline-small" style={{ color: 'hsl(var(--md-sys-color-on-surface-variant))', maxWidth: '700px', margin: '0 auto' }}>
                    Empowering our community through unity, service, and brotherhood.
                </p>
            </header>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="surface-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
                    <h2 className="headline-medium" style={{ marginBottom: '1.5rem' }}>Welcome to our Community</h2>
                    <p className="body-large" style={{ marginBottom: '2rem', color: 'hsl(var(--md-sys-color-on-surface-variant))' }}>
                        Stay updated with our latest activities, news, and programs. Join us in our mission to serve.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/news" className="btn btn-primary">Read News</Link>
                        <Link to="/officials" className="btn btn-secondary">Meet Officials</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

