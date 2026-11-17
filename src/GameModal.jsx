import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CircleHelp,
  Gamepad2,
  Maximize,
  Minimize,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Star,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { formatLongDate, GAME_TYPE_META } from './calendar.js';
import GameStage from './games/GameStage.jsx';
import ControlGuide from './games/ControlGuide.jsx';
import { GameClockContext, releaseGameInputs } from './games/GameSession.jsx';
import { createGameClock } from './games/gameClock.js';
import { isSoundMuted, setSoundMuted, sfx } from './sound.js';

export default function GameModal({
  holiday,
  previousRecord,
  onRecord,
  onClose,
  theme,
  onThemeChange,
}) {
  const [result, setResult] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [round, setRound] = useState(0);
  const [muted, setMuted] = useState(isSoundMuted);
  const [expanded, setExpanded] = useState(false);
  const [viewNotice, setViewNotice] = useState('');
  const [panel, setPanel] = useState(null); // null | pause | help
  const [clock] = useState(createGameClock);
  const modalRef = useRef(null);
  const returnFocusRef = useRef(document.activeElement);
  const viewportRef = useRef(null);
  const surfaceRef = useRef(null);
  const overlayRef = useRef(null);
  const resultRef = useRef(null);
  const nativeFullscreenRef = useRef(false);
  const fullscreenPendingRef = useRef(false);
  const completedRef = useRef(false);
  const baselineBestRef = useRef(
    Number.isFinite(Number(previousRecord?.bestScore)) ? Number(previousRecord.bestScore) : 0,
  );
  const game = holiday.game;
  const meta = GAME_TYPE_META[game.type] ?? { badge: 'ARCADE', goalLabel: 'RETO' };
  const paused = Boolean(panel);

  const changePanel = useCallback(
    (next) => {
      clock.setPaused(Boolean(next));
      releaseGameInputs();
      setPanel(next);
    },
    [clock],
  );

  useEffect(() => {
    const previousFocus = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clock.cancelAll();
      releaseGameInputs();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [clock]);

  useEffect(() => {
    // Volver a la pestaña NO reanuda automáticamente: el jugador decide cuándo seguir.
    const pauseAway = () => {
      if (!completedRef.current) changePanel('pause');
    };
    const onVisibility = () => {
      if (document.hidden) pauseAway();
    };
    window.addEventListener('blur', pauseAway);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', pauseAway);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [changePanel]);

  useEffect(() => {
    const syncFullscreen = () => {
      const active = document.fullscreenElement === modalRef.current;
      if (active) {
        nativeFullscreenRef.current = true;
        setExpanded(true);
        setViewNotice('');
      } else if (nativeFullscreenRef.current) {
        nativeFullscreenRef.current = false;
        setExpanded(false);
        releaseGameInputs();
        queueMicrotask(() => {
          const target =
            modalRef.current?.querySelector('.session-overlay [data-resume]') ??
            modalRef.current?.querySelector('.game-result h3') ??
            surfaceRef.current;
          target?.focus({ preventScroll: true });
        });
      }
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      viewport.style.setProperty('--play-height', `${Math.floor(entry.contentRect.height)}px`);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [result]);

  useEffect(() => {
    if (panel) overlayRef.current?.querySelector('[data-resume]')?.focus({ preventScroll: true });
    else if (result) resultRef.current?.focus({ preventScroll: true });
    else surfaceRef.current?.focus({ preventScroll: true });
  }, [panel, result, round]);

  const handleComplete = useCallback(
    (outcome) => {
      if (completedRef.current) return;
      completedRef.current = true;
      const score = Number.isFinite(Number(outcome.score))
        ? Math.max(0, Math.round(Number(outcome.score)))
        : 0;
      const stars = Number.isFinite(Number(outcome.stars))
        ? Math.max(0, Math.min(3, Math.floor(Number(outcome.stars))))
        : 0;
      const normalized = { ...outcome, score, stars };
      const beatRecord = Boolean(normalized.won && score > baselineBestRef.current);
      baselineBestRef.current = Math.max(score, baselineBestRef.current);
      onRecord(holiday.id, normalized);
      setIsNewRecord(beatRecord);
      setResult(normalized);
      releaseGameInputs();
    },
    [holiday.id, onRecord],
  );

  function toggleMute() {
    const next = setSoundMuted(!muted);
    setMuted(next);
    if (!next) sfx.tap();
  }

  async function toggleFullscreen() {
    if (fullscreenPendingRef.current) return;
    releaseGameInputs();
    fullscreenPendingRef.current = true;
    try {
      if (expanded) {
        if (document.fullscreenElement === modalRef.current) await document.exitFullscreen();
        setExpanded(false);
        setViewNotice('');
      } else {
        // Siempre hay una alternativa CSS para navegadores o iframes sin Fullscreen API.
        setExpanded(true);
        try {
          if (!modalRef.current.requestFullscreen) throw new Error('Fullscreen no disponible');
          await modalRef.current.requestFullscreen({ navigationUI: 'hide' });
        } catch {
          setViewNotice('Vista ampliada · el navegador no permite ocultar sus barras.');
        }
      }
    } catch {
      if (document.fullscreenElement === modalRef.current)
        setViewNotice('Pulsa Esc para salir de la pantalla completa del navegador.');
      else {
        setExpanded(false);
        setViewNotice('');
      }
    } finally {
      fullscreenPendingRef.current = false;
      const target =
        modalRef.current?.querySelector('.session-overlay [data-resume]') ??
        resultRef.current ??
        surfaceRef.current;
      target?.focus({ preventScroll: true });
    }
  }

  function closeModal() {
    if (document.fullscreenElement === modalRef.current) document.exitFullscreen().catch(() => {});
    onClose();
  }

  function restart() {
    releaseGameInputs();
    clock.cancelAll();
    clock.setPaused(false);
    completedRef.current = false;
    setPanel(null);
    setResult(null);
    setIsNewRecord(false);
    setRound((value) => value + 1);
  }

  function handleModalKeyDown(event) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.target.closest('input, select, textarea, [contenteditable="true"]')
    )
      return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (expanded) toggleFullscreen();
      else if (panel) changePanel(null);
      else closeModal();
      return;
    }
    const shortcut = ['KeyF', 'KeyP', 'KeyM'].includes(event.code) || event.key === '?';
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;
      if (event.code === 'KeyF') toggleFullscreen();
      if (event.code === 'KeyM') toggleMute();
      if (event.code === 'KeyP' && !result) changePanel(paused ? null : 'pause');
      if (event.key === '?' && !result) changePanel(panel === 'help' ? null : 'help');
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [
      ...event.currentTarget.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ].filter(
      (element) =>
        element.tabIndex >= 0 && !element.closest('[inert]') && element.getClientRects().length > 0,
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) {
      event.preventDefault();
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === event.currentTarget)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const scopeText =
    holiday.scope === 'national'
      ? 'ESPAÑA · NACIONAL'
      : holiday.scope === 'popular'
        ? 'CELEBRACIÓN POPULAR'
        : holiday.regionLabel.toUpperCase();

  return (
    <div
      className={`game-backdrop ${expanded ? 'is-expanded' : ''}`}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <section
        ref={modalRef}
        tabIndex={-1}
        className={`game-modal ${expanded ? 'is-expanded' : ''}`}
        data-paused={paused}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-title"
        onKeyDown={handleModalKeyDown}
        style={{ '--event-color': holiday.color }}
      >
        <aside className="game-poster">
          <div className="game-poster-orbit game-poster-orbit-one" />
          <div className="game-poster-orbit game-poster-orbit-two" />
          <div className="game-modal-brand">
            <span className="brand-mark brand-mark-small">
              <span />
              <span />
              <span />
              <i />
            </span>
            <span>
              festeja<span className="brand-period">.</span>
            </span>
          </div>
          <span className="game-poster-overline">MINIJUEGO · {meta.badge}</span>
          <div className="game-poster-symbol" aria-hidden="true">
            {holiday.icon}
          </div>
          <div className="game-poster-copy">
            <span>{formatLongDate(holiday.date)}</span>
            <h2>{holiday.name}</h2>
            <p>{holiday.description}</p>
          </div>
          <div className="game-poster-foot">
            <span>{scopeText}</span>
            <span>
              {previousRecord?.bestScore ? `RÉCORD ${previousRecord.bestScore}` : meta.goalLabel}
            </span>
          </div>
          <p className="game-poster-assurance">
            <Gamepad2 size={15} /> A tu ritmo. Pausa cuando quieras.
          </p>
        </aside>

        <div className="game-content">
          <header className="game-content-topline" data-game-chrome>
            <div className="game-toolbar-copy">
              <span className="game-content-kicker">TU PEQUEÑA PAUSA FESTIVA</span>
              <span className="game-toolbar-title">
                <span aria-hidden="true">{holiday.icon}</span> {game.title}
              </span>
            </div>
            <div className="game-top-actions" role="group" aria-label="Opciones del minijuego">
              <button
                type="button"
                className="game-icon-btn"
                onClick={() => changePanel(paused ? null : 'pause')}
                disabled={Boolean(result)}
                aria-label={paused ? 'Reanudar partida' : 'Pausar partida'}
                aria-pressed={paused}
                title="Pausar / reanudar (P)"
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                type="button"
                className="game-icon-btn"
                onClick={() => changePanel(panel === 'help' ? null : 'help')}
                disabled={Boolean(result)}
                aria-label="Cómo jugar"
                aria-expanded={panel === 'help'}
                title="Cómo jugar (?)"
              >
                <CircleHelp size={18} />
              </button>
              <button
                type="button"
                className="game-icon-btn"
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno'}
                title={theme === 'dark' ? 'Modo diurno' : 'Modo nocturno'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                className="game-icon-btn"
                onClick={toggleMute}
                aria-label={muted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
                title="Sonido (M)"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button
                type="button"
                className="game-icon-btn game-expand-btn"
                onClick={toggleFullscreen}
                aria-label={expanded ? 'Salir de pantalla completa' : 'Ampliar a pantalla completa'}
                aria-pressed={expanded}
                title={expanded ? 'Salir de pantalla completa (F / Esc)' : 'Pantalla completa (F)'}
              >
                {expanded ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
              <button
                type="button"
                className="game-close"
                onClick={closeModal}
                aria-label="Cerrar minijuego"
                title="Volver al calendario"
              >
                <X size={19} />
              </button>
            </div>
          </header>
          {viewNotice && (
            <p className="game-view-notice" role="status">
              {viewNotice}
            </p>
          )}

          {result ? (
            <div className="game-result" key="complete">
              <div className={`result-medal ${result.won ? '' : 'result-medal-retry'}`}>
                {result.won ? <Trophy size={30} /> : <RotateCcw size={26} />}
              </div>
              <div className="result-stars" aria-label={`${result.stars} de 3 estrellas`}>
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    size={22}
                    className={n <= result.stars ? 'star-filled' : 'star-empty'}
                  />
                ))}
              </div>
              <span className="game-content-kicker">
                {result.won
                  ? isNewRecord
                    ? '¡VICTORIA Y NUEVO RÉCORD!'
                    : '¡MINIJUEGO SUPERADO!'
                  : '¡CASI LO TIENES!'}
              </span>
              <h3 id="game-title" ref={resultRef} tabIndex={-1}>
                {result.won
                  ? result.stars === 3
                    ? '¡Lo has bordado!'
                    : '¡Gran partida!'
                  : '¡A por la revancha!'}
              </h3>
              <p>{result.summary}</p>
              <div className="result-score">
                <strong>{result.score}</strong>
                <span>{result.unit}</span>
              </div>
              <div className="result-actions">
                <button type="button" className="game-primary-button" onClick={restart}>
                  <RotateCcw size={16} />
                  {result.won ? 'Jugar otra vez' : 'Reintentar ahora'}
                </button>
                <button type="button" className="game-secondary-button" onClick={closeModal}>
                  Volver al calendario <ArrowUpRight size={16} />
                </button>
              </div>
              <p className="result-saved">
                Récords locales, cuando el navegador permite guardarlos.
              </p>
            </div>
          ) : (
            <>
              <div className="game-heading">
                <span className="game-step-label">
                  {meta.badge} · {holiday.shortName.toUpperCase()}
                </span>
                <h3 id="game-title">{game.title}</h3>
                <p>{game.instruction}</p>
              </div>
              <div className="game-viewport" ref={viewportRef}>
                <div
                  ref={surfaceRef}
                  className="game-play-surface"
                  tabIndex={0}
                  inert={paused ? '' : undefined}
                  aria-label="Zona de juego. P para pausar, F para ampliar, signo de interrogación para ver los controles."
                  onPointerDownCapture={(event) => {
                    if (event.target.closest('canvas'))
                      surfaceRef.current.focus({ preventScroll: true });
                  }}
                  onClickCapture={(event) => {
                    if (
                      event.target.closest('.canvas-start-btn, .game-stats-line > button') ||
                      (event.detail > 0 && event.target.closest('.full-action-btn, .touch-btn'))
                    )
                      queueMicrotask(() => surfaceRef.current?.focus({ preventScroll: true }));
                  }}
                >
                  <GameClockContext.Provider value={clock}>
                    <GameStage
                      key={`${holiday.id}-${round}`}
                      game={game}
                      onComplete={handleComplete}
                    />
                  </GameClockContext.Provider>
                </div>
                {panel && (
                  <div className="session-overlay" ref={overlayRef} data-game-chrome>
                    <div
                      className="session-panel"
                      role="region"
                      aria-labelledby="session-panel-title"
                    >
                      <span className="session-panel-icon">
                        {panel === 'help' ? <Gamepad2 size={24} /> : <Pause size={24} />}
                      </span>
                      <span className="game-step-label">
                        {panel === 'help' ? 'TODO LISTO PARA JUGAR' : 'SIN PRISA, SIN PERDER NADA'}
                      </span>
                      <h4 id="session-panel-title">
                        {panel === 'help' ? 'Así se juega.' : 'Partida en pausa.'}
                      </h4>
                      <p>El tiempo está detenido. Tu partida sigue justo donde la dejaste.</p>
                      {panel === 'help' && <ControlGuide type={game.type} />}
                      <button
                        type="button"
                        className="game-primary-button"
                        data-resume
                        onClick={() => changePanel(null)}
                      >
                        <Play size={16} />
                        Continuar jugando
                      </button>
                      {panel === 'pause' && (
                        <button
                          type="button"
                          className="game-secondary-button"
                          onClick={() => changePanel('help')}
                        >
                          <CircleHelp size={16} />
                          Ver los controles
                        </button>
                      )}
                      <button type="button" className="game-secondary-button" onClick={restart}>
                        <RotateCcw size={15} />
                        Reiniciar partida
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="game-shortcuts" data-game-chrome>
                <span>
                  <kbd>P</kbd> pausa <i>·</i> <kbd>F</kbd> pantalla completa <i>·</i> <kbd>M</kbd>{' '}
                  sonido
                </span>
                <button type="button" onClick={() => changePanel('help')}>
                  <CircleHelp size={14} />
                  Controles
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
