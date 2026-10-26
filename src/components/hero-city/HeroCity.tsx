"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
const CityCanvas = lazy(() => import('./CityCanvas'));
const SoftwareCity = lazy(() => import('./SoftwareCity'));

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function CityHost() {
  const shell = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [load, setLoad] = useState(false);
  const [visible, setVisible] = useState(true);
  const [light, setLight] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [version, setVersion] = useState(0);
  const [reset, setReset] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [message, setMessage] = useState('Drag to explore · scroll or pinch to zoom');

  useEffect(() => {
    const node = shell.current;
    if (!node) return;
    const observe = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setLoad(true); setVisible(entry.isIntersecting); }, { rootMargin: '0px' });
    observe.observe(node);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduced(motion.matches);
    const syncTheme = () => setLight(document.documentElement.dataset.theme === 'light');
    const syncVisibility = () => setDocumentVisible(!document.hidden);
    const themes = new MutationObserver(syncTheme);
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncVisibility);
    let scrollTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setScrolling(true);
      document.documentElement.classList.add('page-scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { setScrolling(false); document.documentElement.classList.remove('page-scrolling'); }, 180);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    syncMotion(); syncTheme(); syncVisibility();
    return () => { clearTimeout(scrollTimer); window.removeEventListener('scroll', onScroll); document.documentElement.classList.remove('page-scrolling'); observe.disconnect(); themes.disconnect(); motion.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);

  const fallback = <div className="city-fallback"><img src="/portfolio-robot.png" alt="Friendly portfolio robot" width="260" height="260"/><p>3D view unavailable on this device.</p><p>Your portfolio links still work below.</p><button type="button" onClick={() => { setReady(false); setFailed(false); setUnavailable(false); setVersion(v => v + 1); }}>Try 3D again</button></div>;
  return <div ref={shell} className={`city-experience${ready ? ' is-ready' : ''}`} data-renderer={failed ? 'compatibility' : 'webgl'}>
    <div className="city-canvas-wrap" role="group" aria-label="Interactive 3D robot and miniature city. Drag to orbit, pinch or scroll to zoom. Use arrow keys when the scene is focused; Home resets the camera.">
      {(!ready && !unavailable) && <div className="city-loading" role="status"><span className="city-loader"/>Preparing your little world…</div>}
      {unavailable ? fallback : load && <SceneBoundary key={`${version}-${failed}`} fallback={null} onError={() => { setReady(false); if (failed) setUnavailable(true); else setFailed(true); }}><Suspense fallback={null}>{failed ? <SoftwareCity light={light} reduced={reduced || paused} active={visible && documentVisible && !scrolling} reset={reset} onReady={() => setReady(true)} onRobotReact={() => setMessage('Hello, explorer!')} onIdle={() => setMessage('Drag to explore · scroll or pinch to zoom')}/> : <CityCanvas light={light} reduced={reduced || paused} active={visible && documentVisible && !scrolling} reset={reset} onReady={() => setReady(true)} onFailure={() => { setReady(false); setFailed(true); }} onRobotReact={() => setMessage('Hello, explorer!')} onIdle={() => setMessage('Drag to explore · scroll or pinch to zoom')}/>}</Suspense></SceneBoundary>}
    </div>
    <div className="city-toolbar">
      <span className="city-hint" aria-live="polite">{message}{failed && ready && <span className="city-mode">Compatibility 3D</span>}<span className="city-performance-note">If the page feels slow, pause the 3D animation.</span></span>
      <div className="city-buttons">
        <button type="button" className="city-pause" aria-label={paused ? 'Resume scene animation' : 'Pause scene animation'} aria-pressed={paused} onClick={() => setPaused(v => !v)} disabled={!ready || reduced}>{paused ? '▶' : 'Ⅱ'}</button>
        <button type="button" className="city-reset" onClick={() => { setReset(v => v + 1); setMessage('Drag to explore · scroll or pinch to zoom'); }} disabled={!ready} aria-label="Reset 3D view"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg><span>Reset view</span></button>
      </div>
    </div>
  </div>;
}

export default function HeroCity() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(document.getElementById('hero-city-mount')); }, []);
  return target ? createPortal(<CityHost/>, target) : null;
}
