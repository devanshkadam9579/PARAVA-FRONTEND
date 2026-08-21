import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import './login.css'

const SOFT_EASE = [0.22, 1, 0.3, 1] as const

export default function ParvaLogin({ onGoogleLogin, onEmail, onVendorLogin }: { onGoogleLogin?: () => void; onEmail?: () => void; onVendorLogin?: () => void; }) {
  const hostRef = useRef<HTMLDivElement>(null)
  useLiquidGlass(hostRef)
  return (
    <div ref={hostRef} className="scene-host tide" style={{ position: 'relative', width: '100%', minHeight: '100vh', borderRadius: 0, overflow: 'hidden', background: '#eff4f8', display: 'flex', flexDirection: 'column' }}>
      <LoginScreen playKey={0} onGoogleLogin={onGoogleLogin} onEmail={onEmail} onVendorLogin={onVendorLogin} />
    </div>
  )
}

function LoginScreen({ playKey, onGoogleLogin, onEmail, onVendorLogin }: { playKey: string | number; onGoogleLogin?: () => void; onEmail?: () => void; onVendorLogin?: () => void; }) {
  const soft = SOFT_EASE
  return (
    <div key={String(playKey)} className="lo" style={{ width: '100%', height: '100%', minHeight: '100vh', borderRadius: 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'transparent' }}>
      {/* huge warm glow welling up from the bottom, the Fuse signature */}
      <motion.div className="lo-glow" initial={{ opacity: 0, y: 90 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 1.1, ease: soft }} aria-hidden="true" />
      <div className="lo-copy" style={{ marginTop: '20vh' }}>
        {/* the mark leads the copy stack — one anchored group over the glow,
            not an island floating in the empty sky */}
        <motion.div
          className="lo-brand glass"
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ opacity: { delay: 0.3, duration: 0.15 }, default: { delay: 0.3, duration: 0.6, ease: [0.34, 1.4, 0.5, 1] } }}
        >
          <img src="/parva-logo.png" alt="PARVA Logo" />
        </motion.div>
        <motion.h3 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.6, ease: soft }}>
          Plan. Book. Celebrate.
        </motion.h3>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54, duration: 0.55, ease: soft }}>
          Sign in to discover the best vendors for your perfect event.
        </motion.p>
      </div>
      <motion.div
        className="lo-sheet glass"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ opacity: { delay: 0.62, duration: 0.16 }, default: { delay: 0.62, duration: 0.6, ease: soft } }}
        style={{ marginTop: 'auto', marginBottom: '24px' }}
      >
        <motion.button type="button" className="lo-btn lo-btn-google" onClick={onGoogleLogin} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.45, ease: soft }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" fill="#4285F4" />
            <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" fill="#34A853" />
            <path d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" fill="#FBBC05" />
            <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335" />
          </svg>
          Continue with Google
        </motion.button>
        <motion.button type="button" className="lo-email" onClick={onEmail} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.88, duration: 0.4 }}>
          Continue with email
        </motion.button>
        <motion.button type="button" className="lo-email" onClick={onVendorLogin} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.90, duration: 0.4 }} style={{ marginTop: '0px' }}>
          Vendor Login
        </motion.button>
        <motion.p className="lo-terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.98, duration: 0.45 }}>
          By continuing you agree to our Terms and Privacy Policy.
        </motion.p>
      </motion.div>
    </div>
  )
}

// Chromium supports SVG filter references inside backdrop-filter; Safari does
// not, so it falls back to plain blur via the --lg custom-property default.
const LG_SUPPORTED = typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'url(#lg)')

function lgMap(w: number, h: number, r: number, bezel: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const data = img.data
  const cx = w / 2
  const cy = h / 2
  const ax = cx - r // half-extents of the straight core between the corner arcs
  const ay = cy - r
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mx = x + 0.5 - cx
      const my = y + 0.5 - cy
      const qx = Math.abs(mx) - ax
      const qy = Math.abs(my) - ay
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      // signed distance to the rounded-rect edge (negative inside)
      const d = Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r
      const t = Math.min(1, Math.max(0, 1 + d / bezel))
      const p = 1 - Math.sqrt(1 - t * t)
      // outward normal of the SDF, un-mirrored from the abs() fold
      let nx = 0
      let ny = 0
      if (p > 0) {
        if (ox > 0 || oy > 0) {
          const l = Math.hypot(ox, oy) || 1
          nx = ox / l
          ny = oy / l
        } else if (qx > qy) nx = 1
        else ny = 1
        if (mx < 0) nx = -nx
        if (my < 0) ny = -ny
      }
      const i = (y * w + x) * 4
      data[i] = Math.round(128 - nx * 127 * p)
      data[i + 1] = Math.round(128 - ny * 127 * p)
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

export function useLiquidGlass(hostRef: { current: HTMLElement | null }) {
  useEffect(() => {
    const host = hostRef.current
    if (!LG_SUPPORTED || !host) return
    const NS = 'http://www.w3.org/2000/svg'
    const defs = document.createElementNS(NS, 'svg')
    defs.setAttribute('class', 'lg-defs')
    defs.setAttribute('aria-hidden', 'true')
    host.appendChild(defs)

    let seq = 0
    type Rec = { img: SVGElement; disp: SVGElement; f: SVGElement; w: number; h: number }
    const filters = new Map<HTMLElement, Rec>()

    const update = (el: HTMLElement) => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      let rec = filters.get(el)
      if (!rec) {
        const id = `lg-${++seq}`
        const f = document.createElementNS(NS, 'filter')
        f.setAttribute('id', id)
        // sRGB: channel maths must see 128 as the exact midpoint, or the whole
        // backdrop shears sideways
        f.setAttribute('color-interpolation-filters', 'sRGB')
        const img = document.createElementNS(NS, 'feImage')
        img.setAttribute('result', 'map')
        const disp = document.createElementNS(NS, 'feDisplacementMap')
        disp.setAttribute('in', 'SourceGraphic')
        disp.setAttribute('in2', 'map')
        disp.setAttribute('xChannelSelector', 'R')
        disp.setAttribute('yChannelSelector', 'G')
        f.appendChild(img)
        f.appendChild(disp)
        defs.appendChild(f)
        rec = { img, disp, f, w: 0, h: 0 }
        filters.set(el, rec)
        el.style.setProperty('--lg', `url(#${id}) blur(3px) saturate(1.08) brightness(1.05)`)
      }
      if (rec.w === w && rec.h === h) return
      rec.w = w
      rec.h = h
      const raw = getComputedStyle(el).borderTopLeftRadius
      const r = Math.min(raw.endsWith('%') ? (parseFloat(raw) / 100) * Math.min(w, h) : parseFloat(raw) || 0, w / 2, h / 2)
      const bezel = Math.max(5, Math.min(14, Math.min(w, h) * 0.18))
      rec.img.setAttribute('href', lgMap(w, h, r, bezel))
      rec.img.setAttribute('x', '0')
      rec.img.setAttribute('y', '0')
      rec.img.setAttribute('width', String(w))
      rec.img.setAttribute('height', String(h))
      rec.disp.setAttribute('scale', String(Math.round(bezel * 2.5)))
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry.target as HTMLElement)
    })
    const scan = () => {
      const live = new Set(Array.from(host.querySelectorAll<HTMLElement>('.glass')))
      live.forEach((el) => {
        if (!filters.has(el)) {
          update(el)
          ro.observe(el)
        }
      })
      filters.forEach((rec, el) => {
        if (!live.has(el)) {
          ro.unobserve(el)
          rec.f.remove()
          filters.delete(el)
        }
      })
    }
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => {
      mo.disconnect()
      ro.disconnect()
      defs.remove()
    }
  }, [hostRef])
}
