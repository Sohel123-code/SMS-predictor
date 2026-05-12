import { useState, useRef, useEffect } from 'react'
import './index.css'

const SAMPLE_MESSAGES = [
  { label: 'Prize Winner',   text: 'Congratulations! You have won a $1000 Walmart gift card. Go to http://bit.ly/claim to claim now.' },
  { label: 'Special Offer',  text: 'FREE entry in 2 a weekly comp to win FA Cup final tkts 21st May 2005. Text FA to 87121 to receive entry question(std txt rate)' },
  { label: 'Normal Text',    text: 'Hey, are you coming to the party tonight? Let me know so I can pick you up.' },
  { label: 'Reminder',       text: 'Your appointment with Dr. Smith is confirmed for tomorrow at 3 PM. Reply STOP to cancel reminders.' },
]

const MAX_CHARS = 500

function RobotFace({ mousePos, isTyping, isSpam, isNormal }) {
  // Calculate relative mouse position
  // Assume viewport center is roughly (window.innerWidth / 2, window.innerHeight / 2)
  // For simplicity and avoiding SSR issues, we use window object defensively
  const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
  const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 500;
  
  // Calculate delta based on mouse pos
  const maxEyeMove = 4;
  let dx = 0;
  let dy = 0;

  if (mousePos.x !== 0 || mousePos.y !== 0) {
    dx = ((mousePos.x - cx) / cx) * maxEyeMove;
    dy = ((mousePos.y - cy) / cy) * maxEyeMove;
  }

  let faceClass = '';
  if (isSpam) faceClass = 'is-spam';
  else if (isNormal) faceClass = 'is-normal';
  else if (isTyping) faceClass = 'is-typing';

  return (
    <div className={`robot-face ${faceClass}`} aria-hidden="true">
      <div className="robot-antenna"></div>
      <div className="robot-head">
        <div className="robot-ears"></div>
        <div className="robot-eyes-container">
          <div className="robot-eye">
            <div className="robot-pupil" style={{ transform: `translate(${dx}px, ${dy}px)` }} />
          </div>
          <div className="robot-eye">
            <div className="robot-pupil" style={{ transform: `translate(${dx}px, ${dy}px)` }} />
          </div>
        </div>
        <div className="robot-mouth"></div>
      </div>
    </div>
  )
}

export default function App() {
  const [message, setMessage]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const textareaRef             = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handlePredict = async () => {
    if (!message.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://sms-predictor-1.onrender.com'
      const res = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Server error ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to the backend. Make sure app.py is running on port 5000.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSample = (text) => {
    setMessage(text)
    setResult(null)
    setError(null)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handlePredict()
    }
  }

  const isSpam   = result?.prediction === 1
  const isNormal = result?.prediction === 0
  const isTyping = document.activeElement === textareaRef.current && message.length > 0;

  return (
    <>
      <main className="app-wrapper">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-badge">
            <span className="badge-dot" />
            Logistic Regression
          </div>
          <h1>SMS Spam Detector</h1>
          <p>Paste any SMS message below and our machine-learning model will instantly classify it as spam or legitimate.</p>
        </header>

        {/* ── Main card ── */}
        <section className="main-card" aria-label="Message classifier">

          <label className="form-label" htmlFor="sms-input">Your Message</label>

          <div className="input-area-layout">
            <div className="textarea-wrapper">
              <textarea
                id="sms-input"
                ref={textareaRef}
                className="sms-textarea"
                placeholder="Type or paste an SMS message here… (Ctrl+Enter to analyze)"
                value={message}
                maxLength={MAX_CHARS}
                onChange={e => { setMessage(e.target.value); setResult(null); setError(null) }}
                onKeyDown={handleKeyDown}
                aria-label="SMS message input"
              />
              <span className={`char-count${message.length > MAX_CHARS * 0.85 ? ' warning' : ''}`}>
                {message.length}/{MAX_CHARS}
              </span>
            </div>
            
            <div className="robot-wrapper">
              <RobotFace mousePos={mousePos} isTyping={isTyping} isSpam={isSpam} isNormal={isNormal} />
            </div>
          </div>

          {/* Sample pills */}
          <div className="samples-section">
            <p className="samples-label">Try a sample →</p>
            <div className="samples-row">
              {SAMPLE_MESSAGES.map(s => (
                <button
                  key={s.label}
                  className="sample-pill"
                  onClick={() => handleSample(s.text)}
                  title={s.text}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            id="analyze-btn"
            className="submit-btn"
            onClick={handlePredict}
            disabled={!message.trim() || loading}
            aria-busy={loading}
          >
            <span className="btn-inner">
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Analyzing…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Analyze Message
                </>
              )}
            </span>
          </button>

          {/* Error */}
          {error && (
            <div className="error-box" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`result-card ${isSpam ? 'spam' : 'ham'}`} role="region" aria-label="Prediction result">
              <div className="result-shimmer" aria-hidden="true" />

              <div className="result-top">
                <div className="result-icon" aria-hidden="true">
                  {isSpam ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className="result-title">
                    {isSpam ? 'Spam Detected' : 'Looks Legitimate'}
                  </div>
                  <div className="result-subtitle">
                    {isSpam
                      ? 'This message contains spam signals.'
                      : 'This message appears to be genuine.'}
                  </div>
                </div>
              </div>

              <div className="confidence-section">
                <div className="confidence-header">
                  <span className="confidence-label">Model Confidence</span>
                  <span className="confidence-value">{result.confidence}%</span>
                </div>
                <div className="confidence-bar-track" role="progressbar" aria-valuenow={result.confidence} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className="confidence-bar-fill"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <div className="stat-box-label">Classification</div>
                  <div className="stat-box-value" style={{ color: isSpam ? 'var(--spam-color)' : 'var(--ham-color)' }}>
                    {isSpam ? 'SPAM (1)' : 'NOT SPAM (0)'}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-label">Message Length</div>
                  <div className="stat-box-value">{message.trim().length} chars</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Divider ── */}
        <div className="divider" aria-hidden="true" />

        {/* ── How it works ── */}
        <section className="how-it-works" aria-label="How it works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <svg className="step-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <div className="step-title">Input Message</div>
              <div className="step-desc">Paste or type any SMS text into the input area above.</div>
            </div>
            <div className="step-card">
              <svg className="step-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <div className="step-title">ML Processing</div>
              <div className="step-desc">TF-IDF vectorization and Logistic Regression model scores the text.</div>
            </div>
            <div className="step-card">
              <svg className="step-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
              <div className="step-title">Get Results</div>
              <div className="step-desc">Instant classification with confidence score is displayed.</div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="footer">
          Built with <span>Flask + scikit-learn</span> backend &amp; React + Vite frontend
        </footer>

      </main>
    </>
  )
}
