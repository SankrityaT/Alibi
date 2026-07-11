export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.75rem',
        textAlign: 'center',
        padding: '2rem',
        background:
          'repeating-linear-gradient(100deg, rgba(212,149,46,0.05) 0px, rgba(212,149,46,0.05) 2px, transparent 2px, transparent 140px), radial-gradient(ellipse at 50% 30%, #23190f 0%, #0b0a08 70%)'
      }}
    >
      <span className="uppercase-label" style={{ letterSpacing: '0.4em' }}>
        Case File No. 004 &mdash; Missing Courier
      </span>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(4.5rem, 16vw, 9rem)',
          letterSpacing: '0.06em',
          margin: 0,
          color: 'var(--paper)',
          textShadow: '0 0 40px rgba(158,27,27,0.55), 0 2px 0 #000',
          animation: 'flicker 7s infinite'
        }}
      >
        Alibi
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--paper-dim)',
          maxWidth: '32ch',
          lineHeight: 1.6,
          margin: 0
        }}
      >
        Four suspects. One vanished courier. Every word you say to them, they
        remember &mdash; whether it was true or not.
      </p>

      <a
        href="/station"
        style={{
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: '0.85rem',
          color: 'var(--paper)',
          textDecoration: 'none',
          border: '1px solid var(--accent)',
          padding: '0.9rem 2.2rem',
          marginTop: '0.5rem',
          position: 'relative',
          transition: 'background-color 150ms ease, box-shadow 150ms ease'
        }}
      >
        Enter the station
      </a>
    </main>
  )
}
