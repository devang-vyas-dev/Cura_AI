import { useState, useRef, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import { authClient, getBearerToken } from './components/auth'

/*
  FLOW RULES (frontend auth gate)
  • Not signed in → the SIGNUP screen is the first thing that loads.
  • Signed in    → the upload experience.
  • Every upload entry point (button, camera, drag & drop) is guarded:
    an anonymous user can never submit a prescription image.
  • After logging in, an interrupted upload resumes automatically.
*/
export default function App() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [pendingUpload, setPendingUpload] = useState(false)
  const [preview, setPreview] = useState(null)
  const [step, setStep] = useState(0)
  const [resultData, setResultData] = useState(null)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [showRaw, setShowRaw] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [locationStatus, setLocationStatus] = useState('denied')
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [errorMsg, setErrorMsg] = useState("")
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

  // Restore the session on load (also handles the Google sign-in redirect back)
  useEffect(() => {
    let alive = true
    authClient.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data?.user || null)
      setAuthReady(true)
    }).catch(() => { if (alive) { setUser(null); setAuthReady(true) } })
    return () => { alive = false }
  }, [])

  // One guard for every upload entry point: no user, no upload —
  // the login wall (signup first) appears instead, and the intent is remembered.
  const requestUpload = (viaCamera = false) => {
    if (!user) { setPendingUpload(true); setPage('home'); return }
    ;(viaCamera ? cameraRef : fileRef).current?.click?.()
  }
  // Called by LoginPage when the guest becomes signed in → fetch session and resume an interrupted upload
  const handleLogin = async (authUser) => {
    if (!authUser) {
      try {
        const { data } = await authClient.getSession()
        authUser = data?.user || null
      } catch { authUser = null }
    }
    setUser(authUser)
    setPage('home')
  }

  // Resume the upload the guest tried to make before being stopped at the wall
  useEffect(() => {
    if (!user || !pendingUpload || !authReady) return
    setPendingUpload(false)
    const t = setTimeout(() => fileRef.current?.click?.(), 250)
    return () => clearTimeout(t)
  }, [user, pendingUpload, authReady])

  const handleSignOut = async () => {
    try { await authClient.signOut() } catch { /* ignore */ }
    setPendingUpload(false)
    setUser(null)            // login wall (signup first) reappears
    setPage('home')
  }


  const uploadPrescription = async (imageFile) => {
    console.log("Calling REAL backend:", `${API}/api/v1/analyze-prescription`)
    // Backend verifies a Neon Auth RS256 JWT against its JWKS — send it as Bearer
    let token = null
    try { token = await getBearerToken() } catch { /* handled below */ }
    if (!token) throw new Error("Your session expired. Please sign in again, then re-upload.")
    const formData = new FormData()
    formData.append("file", imageFile)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)
    try {
      const res = await fetch(`${API}/api/v1/analyze-prescription`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Backend ${res.status}: ${txt}`)
      }
      return await res.json()
    } finally {
      clearTimeout(timeout)
    }
  }

  const fetchLocation = () => {
    setLocationStatus('loading')
    if (!navigator.geolocation) {
      setLocationStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus('granted')
        setNearbyPlaces([])
      },
      () => setLocationStatus('denied'),
      { timeout: 8000 }
    )
  }

  const handleFile = async (file) => {
    if (!file) return
    // HARD RULE: uploads never bypass the auth wall, even via drag & drop.
    if (authReady && !user) { setPendingUpload(true); return }
    if (!file.type.startsWith('image/')) { alert('Upload JPG/PNG'); return }
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setPage('processing')
    setStep(0)
    setAnimatedScore(0)
    setResultData(null)
    setShowRaw(false)
    setErrorMsg("")
    setIsDragging(false)

    let interval = setInterval(() => setStep(s => s < 3? s + 1 : s), 800)

    try {
      const data = await uploadPrescription(file)
      clearInterval(interval)
      setStep(4)
      console.log("✅ REAL DATA FROM RAILWAY:", data)

      // FINAL FIX - BACKEND MAP
      setResultData({
        risk_score: data.risk_score?? 0,
        summary: data.summary?? data.risks?.[0]?? data.recommendations?.[0]?? "",
        patient: data.file_name?? data.patient?? "Patient",
        medicines: data.medicines_detected?? data.medicines?? data.data?? data.meds?? [],
        risks: data.risks?? data.interactions?? [],
        recommendations: data.recommendations?? [],
        raw_ocr: data.ocr_text?? data.raw_ocr?? "",
      })
      setTimeout(() => { setPage('result'); fetchLocation() }, 400)
    } catch (e) {
      clearInterval(interval)
      console.error("❌ Backend failed - NO MOCK:", e)
      setErrorMsg(e.message || "Backend not reachable. Please check Railway is ON.")
      setTimeout(() => setPage('error'), 500)
    }
  }

  useEffect(() => {
    if (page!== 'result' ||!resultData) return
    const end = resultData.risk_score
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / 900, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimatedScore(Math.round(eased * end))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [page, resultData])

  return (
    <div style={{ background: '#e8f6f3', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: '#0a2a2a', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes float { 0%,100%{transform:rotate(6deg) translateY(0)} 50%{transform:rotate(6deg) translateY(-6px)} }
        @keyframes scanMove { 0%{top:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
       .fadeUp{animation:fadeUp.55s ease-out forwards;opacity:0}
       .scaleIn{animation:scaleIn.45s cubic-bezier(.34,1.56,.64,1) forwards;opacity:0}
       .hoverLift{transition:all.22s ease}
       .hoverLift:hover{transform:translateY(-3px);box-shadow:0 10px 22px rgba(14,138,126,.12)!important}
       .d1{animation-delay:.07s}.d2{animation-delay:.16s}.d3{animation-delay:.26s}
       .scan-line{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#0fb5a1,transparent);box-shadow:0 0 12px #0fb5a1;animation:scanMove 2.2s infinite;z-index:3}
      `}</style>

      <header style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0fb5a1', display: 'grid', placeItems: 'center', color: 'white', fontSize: 14 }}>C</div>
          Cura AI
        </div>
        <div style={{ fontSize: 11, background: '#e1f0ef', border: '1px solid #cde3e1', padding: '6px 12px', borderRadius: 20, color: '#5a7a79' }}>MVP : AI prescription safety</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 260 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0e8a7e', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {(user.name || user.email || '?').trim().charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 11, color: '#4a6a68', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || user.email}
                </span>
              </div>
              <button onClick={handleSignOut} style={{ background: '#e4f1f0', color: '#0e8a7e', border: 0, padding: '8px 14px', borderRadius: 18, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Sign out</button>
            </>
          ) : (
            <button onClick={() => setPage('auth')} style={{ background: '#0e8a7e', color: 'white', border: 0, padding: '8px 16px', borderRadius: 18, fontSize: 11, cursor: 'pointer' }}>Sign in</button>
          )}
        </div>
      </header>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { handleFile(e.target.files[0]); e.target.value = '' }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => { handleFile(e.target.files[0]); e.target.value = '' }} />

      <div style={{ flex: 1 }}>
        {/* FIRST PAGE RULE: guests always land on the signup screen */}
        {!authReady && (
          <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #14a89e, #0e8a7e)', margin: '0 auto 14px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 22, boxShadow: '0 12px 24px -8px rgba(14,138,126,.5)' }}>C</div>
              <div style={{ fontSize: 12.5, color: '#5a7a79' }}>Preparing Cura AI…</div>
            </div>
          </div>
        )}

        {authReady && !user && <LoginPage onLogin={handleLogin} />}

        {authReady && user && page === 'home' && (
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '10px 28px 0' }}>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center', paddingTop: 10 }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <h1 className="fadeUp" style={{ fontSize: 46, lineHeight: 1.05, fontWeight: 800, letterSpacing: -0.8, margin: 0 }}>Know what your<br /><span style={{ color: '#0fb5a1' }}>prescription hides.</span></h1>
                <p className="fadeUp d1" style={{ marginTop: 16, color: '#5a777a', fontSize: 13.5, maxWidth: 380, lineHeight: 1.6 }}>Upload a photo of your prescription. Cura AI reads it, checks every medicine for risks, and tells you exactly what to do next.</p>
                <div className="fadeUp d2" style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                  <button onClick={() => requestUpload(false)} style={{ background: '#0e8a7e', color: 'white', padding: '10px 18px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, border: 0, cursor: 'pointer' }}>↑ Upload prescription</button>
                  <button onClick={() => requestUpload(true)} style={{ background: '#dff0ef', color: '#0e8a7e', padding: '10px 18px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, border: 0, cursor: 'pointer' }}>◎ Use camera</button>
                </div>
              </div>
              <div className="scaleIn d2" style={{ flex: 1, minWidth: 380, height: 360, background: '#fff5f0', borderRadius: 28, position: 'relative', overflow: 'hidden', border: '1px solid #e8ddd6', display: 'grid', placeItems: 'center' }}>
                <div style={{ position: 'absolute', bottom: -10, left: -20, right: -20, height: 160, background: 'linear-gradient(90deg,#ffcfbf 0%,#f7b7a0 25%,#c8e8e0 65%,#b8dcd6 100%)', borderRadius: '50% 50% 0 0' }} />
                <div style={{ background: 'white', width: 128, height: 168, borderRadius: 10, border: '2px solid #aee0d6', boxShadow: '0 16px 36px rgba(0,0,0,0.14)', padding: 10, zIndex: 2, animation: 'float 3.5s ease-in-out infinite', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: 3, background: '#e5e5e5', marginBottom: 6 }} />
                  <div style={{ height: 3, width: '70%', background: '#e5e5e5', marginBottom: 14 }} />
                  <div className="scan-line" />
                </div>
              </div>
            </div>

            <div style={{ width: '100%', display: 'grid', placeItems: 'center', marginTop: 34 }}>
              <div onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }} onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }} onDrop={(e) => { e.preventDefault(); setIsDragging(false); user ? handleFile(e.dataTransfer.files[0]) : requestUpload(false) }} onClick={() => user ? fileRef.current?.click() : requestUpload(false)} className="fadeUp d3 hoverLift" style={{ width: '100%', maxWidth: 960, background: isDragging? '#f0faf8' : 'white', borderRadius: 24, border: `2px ${isDragging? 'solid #0fb5a1' : 'dashed transparent'}`, boxShadow: '0 8px 32px rgba(0,0,0,0.06)', padding: '42px 20px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: '#e8f6f3', border: '1.5px solid #b8e0db', display: 'grid', placeItems: 'center', marginBottom: 14 }}>↥</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{isDragging? 'Drop it now!' : 'Drop your prescription here'}</div>
                <div style={{ fontSize: 12.5, color: '#8aa0a3', marginTop: 6 }}>JPG or PNG · analysed privately, never stored</div>
              </div>
            </div>

            <div className="fadeUp d3" style={{ maxWidth: 960, margin: '22px auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div style={{ background: 'white', borderRadius: 18, padding: '18px', border: '1px solid #e6efee' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f6f3', display: 'grid', placeItems: 'center', marginBottom: 12 }}>🧠</div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>OCR + AI reading</div>
                <div style={{ fontSize: 11.5, color: '#7a9a9a', marginTop: 6, lineHeight: 1.5 }}>Handwritten scripts turned into structured medicine data.</div>
              </div>
              <div style={{ background: 'white', borderRadius: 18, padding: '18px', border: '1px solid #e6efee' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f6f3', display: 'grid', placeItems: 'center', marginBottom: 12 }}>🛡</div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>Risk detection</div>
                <div style={{ fontSize: 11.5, color: '#7a9a9a', marginTop: 6, lineHeight: 1.5 }}>Interactions, overdose and duplicate therapy flags.</div>
              </div>
              <div style={{ background: 'white', borderRadius: 18, padding: '18px', border: '1px solid #e6efee' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f6f3', display: 'grid', placeItems: 'center', marginBottom: 12 }}>📍</div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>Care nearby</div>
                <div style={{ fontSize: 11.5, color: '#7a9a9a', marginTop: 6, lineHeight: 1.5 }}>Pharmacies and clinics around you, ranked by distance.</div>
              </div>
            </div>
          </div>
        )}

        {user && page === 'processing' && (
          <div style={{ maxWidth: 980, margin: '18px auto', padding: '0 20px', display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <div className="scaleIn" style={{ flex: 1, minWidth: 320, background: 'white', borderRadius: 18, padding: 14, border: '1px solid #ddebe9' }}>
              {preview && (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={preview} style={{ width: '100%', borderRadius: 12, objectFit: 'contain', maxHeight: 560, display: 'block' }} alt="pres" />
                  <div className="scan-line" />
                </div>
              )}
            </div>
            <div style={{ width: 300, paddingTop: 8 }}>
              {[
                { label: 'Reading prescription', desc: 'Detecting handwriting' },
                { label: 'OCR extraction', desc: 'Converting to text' },
                { label: 'AI processing', desc: 'Understanding medicines' },
                { label: 'Finding risks', desc: 'Checking interactions' },
              ].map((s, i) => (
                <div key={s.label} className={`fadeUp d${i + 1}`} style={{ display: 'flex', gap: 12, marginBottom: 22, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < step? '#0fb5a1' : '#f0f5f5', display: 'grid', placeItems: 'center', fontSize: 12 }}>{i < step? '✓' : '○'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: '#8aa0a3', marginTop: 2 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && page === 'error' && (
          <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ background: 'white', borderRadius: 20, padding: '40px 24px', border: '1px solid #f3d0d0' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Backend not reachable</div>
              <div style={{ fontSize: 13, color: '#7a5a5a', marginTop: 10 }}>{errorMsg}</div>
              <button onClick={() => setPage('home')} style={{ background: '#0e8a7e', color: 'white', border: 0, padding: '10px 18px', borderRadius: 20, marginTop: 20, cursor: 'pointer' }}>Try again</button>
            </div>
          </div>
        )}

        {user && page === 'result' && resultData && (
          <div style={{ maxWidth: 1080, margin: '16px auto', padding: '0 20px', display: 'grid', gap: 14 }}>
            <div className="scaleIn" style={{ background: 'white', borderRadius: 18, padding: '18px', border: '1px solid #ddebe9', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 92, height: 92 }}>
                <svg width="92" height="92" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="46" cy="46" r="38" stroke="#eef5f4" strokeWidth="6" fill="none" />
                  <circle cx="46" cy="46" r="38" stroke={resultData.risk_score > 50? '#ef4444' : '#0fb5a1'} strokeWidth="6" fill="none" strokeDasharray="239" strokeDashoffset={239 - (239 * Math.min(animatedScore, 100) / 100)} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ fontSize: 22, fontWeight: 800 }}>{animatedScore}</div></div>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>Prescription analysis — REAL DATA</div>
                <div style={{ fontSize: 11, color: '#8aa0a3', marginTop: 2 }}>{resultData.patient}</div>
                <div style={{ fontSize: 12.5, color: '#334', marginTop: 8 }}>{resultData.summary || "Analysis complete"}</div>
              </div>
              <button onClick={() => { setPage('home'); setPreview(null) }} style={{ background: '#0e8a7e', color: 'white', border: 0, padding: '8px 14px', borderRadius: 18, fontSize: 11, cursor: 'pointer' }}>+ New scan</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="fadeUp d2" style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid #ddebe9' }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>✓ Medicines detected ({resultData.medicines?.length || 0}) — REAL</div>
                {resultData.medicines?.length === 0 && <div style={{ fontSize: 11.5, color: '#8aa0a3' }}>No medicines returned</div>}
                {resultData.medicines?.map((m, i) => {
                  const name = typeof m === 'string'? m : (m.name || m.title || 'Unknown')
                  const risk = typeof m === 'string'? 'Low' : (m.risk || m.level || 'Low')
                  return (
                    <div key={i} style={{ background: risk === 'Moderate'? '#fff8e1' : '#f0faf7', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ fontSize: 12 }}>{name}</b><span style={{ fontSize: 9, background: risk === 'Moderate'? '#fde2a0' : '#d6f5d6', padding: '3px 8px', borderRadius: 10 }}>{risk}</span></div>
                    </div>
                  )
                })}
                {resultData.recommendations?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>⦿ Recommendations (REAL)</div>
                    <ul style={{ fontSize: 11, color: '#445', lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
                      {resultData.recommendations.map((r, i) => <li key={i}>{typeof r === 'string'? r : JSON.stringify(r)}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="fadeUp d3" style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid #ddebe9' }}>
                <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>⚠ Risks & Interactions — REAL</div>
                {resultData.risks?.length === 0 && <div style={{ fontSize: 11.5, color: '#8aa0a3' }}>No risks returned</div>}
                {resultData.risks?.map((r, i) => {
                  const title = typeof r === 'string'? r : (r.title || r.name || 'Risk')
                  const desc = typeof r === 'string'? '' : (r.desc || r.description || '')
                  return (
                    <div key={i} style={{ background: '#fff8f0', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid #f3e2d0' }}>
                      <b style={{ fontSize: 11.5 }}>{title}</b>
                      {desc && <div style={{ fontSize: 10.5, color: '#7a6a4a', marginTop: 5 }}>{desc}</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="fadeUp d3" style={{ background: 'white', borderRadius: 20, padding: '18px 22px', border: '1px solid #e6efee' }}>
              <div onClick={() => setShowRaw(!showRaw)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ fontSize: 12, transform: showRaw? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>Raw OCR text — REAL</span>
              </div>
              {showRaw && (
                <div style={{ marginTop: 12, background: '#f7fbfb', padding: '12px', borderRadius: 8, fontSize: 11.5, color: '#5a777a', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {resultData.raw_ocr || "No OCR text"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}