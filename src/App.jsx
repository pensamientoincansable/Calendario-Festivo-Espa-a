import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Gamepad2,
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  formatLongDate,
  GAME_TYPE_META,
  getDaysBetween,
  getHolidays,
  getMonthCells,
  getMonthName,
  isoDate,
  REGIONS,
} from './calendar.js';
import GameStage from './games/GameStage.jsx';
import { isSoundMuted, setSoundMuted, sfx } from './sound.js';

const TODAY = new Date();
const TODAY_YEAR = TODAY.getFullYear();
const TODAY_MONTH = TODAY.getMonth();
const TODAY_ISO = isoDate(TODAY_YEAR, TODAY_MONTH + 1, TODAY.getDate());
const WEEKDAY_LABELS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const PROGRESS_KEY = 'festeja:records:v2';

function clampStars(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(3, Math.floor(num)));
}

const GALLERY_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'race', label: 'Carreras', types: ['race'] },
  { id: 'cooking', label: 'Cocina', types: ['cooking'] },
  { id: 'match3', label: 'Candy Match', types: ['match3'] },
  { id: 'navidad-reyes', label: 'Navidad y Reyes', types: ['santa', 'reyes', 'chimes', 'lights'] },
  { id: 'arcade', label: 'Acción y pulso', types: ['runner', 'stacker', 'fireworks', 'catcher', 'breakout', 'candles'] },
];

function loadRecords() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveRecords(records) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(records));
  } catch {
    // Ignorar si el navegador bloquea almacenamiento
  }
}

function capitalize(value = '') {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shortMonth(iso) {
  const month = new Date(`${iso}T00:00:00Z`).getUTCMonth();
  return getMonthName(month).slice(0, 3).replace('.', '');
}

function countdownLabel(date) {
  const difference = getDaysBetween(TODAY_ISO, date);
  if (difference === 0) return 'Hoy';
  if (difference > 0) return `En ${difference} ${difference === 1 ? 'día' : 'días'}`;
  return `Hace ${Math.abs(difference)} ${difference === -1 ? 'día' : 'días'}`;
}

function scopeBadgeLabel(holiday) {
  if (holiday.scope === 'national') return 'FESTIVO NACIONAL';
  if (holiday.scope === 'popular') return 'CELEBRACIÓN POPULAR';
  return `AUTONÓMICO · ${holiday.regionLabel.toUpperCase()}`;
}

function scopePriority(scope) {
  if (scope === 'national') return 0;
  if (scope === 'regional') return 1;
  return 2;
}

function App() {
  const [viewYear, setViewYear] = useState(TODAY_YEAR);
  const [viewMonth, setViewMonth] = useState(TODAY_MONTH);
  const [selectedISO, setSelectedISO] = useState(TODAY_ISO);
  const [region, setRegion] = useState('all');
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [activeGame, setActiveGame] = useState(null);
  const [records, setRecords] = useState(() => loadRecords());

  const closeGame = useCallback(() => setActiveGame(null), []);

  const recordOutcome = useCallback((holidayId, result) => {
    setRecords((prev) => {
      const existing = prev[holidayId] ?? { bestScore: 0, stars: 0, won: false };
      const prevScore = Number.isFinite(Number(existing.bestScore)) ? Number(existing.bestScore) : 0;
      const nextScore = Number.isFinite(Number(result.score)) ? Math.max(0, Math.round(Number(result.score))) : 0;
      const updated = {
        ...prev,
        [holidayId]: {
          bestScore: Math.max(prevScore, nextScore),
          stars: Math.max(clampStars(existing.stars), clampStars(result.stars)),
          won: Boolean(existing.won) || Boolean(result.won),
        },
      };
      saveRecords(updated);
      return updated;
    });
  }, []);

  const yearHolidays = useMemo(() => getHolidays(viewYear, region), [viewYear, region]);
  const allVisibleHolidays = useMemo(() => [
    ...getHolidays(viewYear - 1, region),
    ...yearHolidays,
    ...getHolidays(viewYear + 1, region),
  ], [viewYear, region, yearHolidays]);

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    allVisibleHolidays.forEach((holiday) => {
      const group = map.get(holiday.date) ?? [];
      group.push(holiday);
      group.sort((a, b) => (
        a.scope === b.scope
          ? a.name.localeCompare(b.name)
          : scopePriority(a.scope) - scopePriority(b.scope)
      ));
      map.set(holiday.date, group);
    });
    return map;
  }, [allVisibleHolidays]);

  const monthCells = useMemo(() => getMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthHolidays = useMemo(
    () => yearHolidays.filter((holiday) => holiday.date.slice(0, 7) === isoDate(viewYear, viewMonth + 1, 1).slice(0, 7)),
    [yearHolidays, viewYear, viewMonth],
  );

  const filteredGallery = useMemo(() => {
    const filter = GALLERY_FILTERS.find((item) => item.id === galleryFilter);
    if (!filter || !filter.types) return yearHolidays;
    return yearHolidays.filter((holiday) => filter.types.includes(holiday.game.type));
  }, [galleryFilter, yearHolidays]);

  const selectedEvents = holidaysByDate.get(selectedISO) ?? [];
  const selectedHoliday = selectedEvents[0] ?? null;
  const upcomingHoliday = allVisibleHolidays.find((holiday) => holiday.date > selectedISO) ?? yearHolidays[0] ?? null;
  const focusHoliday = selectedHoliday ?? upcomingHoliday;
  const focusIsSelected = Boolean(selectedHoliday);
  const focusMeta = focusHoliday ? (GAME_TYPE_META[focusHoliday.game.type] ?? { badge: 'ARCADE', label: 'Arcade' }) : null;
  const regionLabel = REGIONS.find((item) => item.id === region)?.label ?? 'Toda España';
  const nationalCount = yearHolidays.filter((holiday) => holiday.scope === 'national').length;
  const completedCount = yearHolidays.filter((holiday) => records[holiday.id]?.won).length;

  function openHolidayGame(holiday) {
    setSelectedISO(holiday.date);
    const date = new Date(`${holiday.date}T00:00:00Z`);
    setViewYear(date.getUTCFullYear());
    setViewMonth(date.getUTCMonth());
    setActiveGame(holiday);
  }

  function handleCellClick(cell) {
    setSelectedISO(cell.iso);
    if (!cell.inMonth) {
      setViewYear(cell.year);
      setViewMonth(cell.month);
    }
    const holiday = (holidaysByDate.get(cell.iso) ?? [])[0];
    if (holiday) setActiveGame(holiday);
  }

  function moveMonth(amount) {
    const next = new Date(Date.UTC(viewYear, viewMonth + amount, 1));
    const nextYear = next.getUTCFullYear();
    const nextMonth = next.getUTCMonth();
    setViewYear(nextYear);
    setViewMonth(nextMonth);
    setSelectedISO(isoDate(nextYear, nextMonth + 1, 1));
  }

  function changeYear(event) {
    const nextYear = Number(event.target.value);
    setViewYear(nextYear);
    setSelectedISO(isoDate(nextYear, viewMonth + 1, 1));
  }

  function goToToday() {
    setViewYear(TODAY_YEAR);
    setViewMonth(TODAY_MONTH);
    setSelectedISO(TODAY_ISO);
    document.getElementById('calendario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const monthName = getMonthName(viewMonth);
  const yearOptions = Array.from({ length: 11 }, (_, index) => viewYear - 5 + index);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand-lockup" href="#inicio" aria-label="Festeja, ir al inicio">
          <span className="brand-mark"><span /><span /><span /><i /></span>
          <span className="brand-name">festeja<span className="brand-period">.</span></span>
          <span className="brand-country">ESPAÑA</span>
        </a>
        <nav className="main-nav" aria-label="Navegación principal">
          <a className="nav-link nav-link-active" href="#calendario">Calendario</a>
          <a className="nav-link" href="#minijuegos">Minijuegos</a>
          <a className="nav-link" href="#tradiciones">Tradiciones</a>
        </nav>
        <button className="today-button" type="button" onClick={goToToday}>
          <CalendarDays size={16} strokeWidth={1.8} />
          <span>Ir a hoy</span>
          <ArrowUpRight size={14} strokeWidth={1.8} />
        </button>
      </header>

      <main id="inicio">
        <section className="intro-section" aria-labelledby="intro-title">
          <div className="intro-copy">
            <p className="eyebrow"><span className="eyebrow-spark">✳</span> EL MAPA FESTIVO DE ESPAÑA</p>
            <h1 id="intro-title">El año también<br /><em>se juega.</em></h1>
            <p className="intro-description">
              Explora los festivos y celebraciones de España y abre cada fecha para disfrutar su propio minijuego interactivo: carreras, cocina española, el trineo de Papá Noel, la cabalgata de Reyes, dulces de Halloween y mucho más.
            </p>
            <div className="intro-actions">
              <a className="intro-link" href="#calendario">Explorar el calendario <ArrowRight size={16} /></a>
              <a className="intro-link intro-link-secondary" href="#minijuegos"><Gamepad2 size={15} /> Ver todos los minijuegos</a>
            </div>
          </div>
          <div className="intro-art" aria-label="Diecinueve comunidades y ciudades autónomas, un mismo calendario">
            <div className="art-grain" />
            <div className="art-orbit art-orbit-one" />
            <div className="art-orbit art-orbit-two" />
            <div className="art-sun-disc"><span className="art-sun-symbol">✳</span><span className="art-sun-dot" /></div>
            <span className="art-star art-star-one">✦</span>
            <span className="art-star art-star-two">✧</span>
            <span className="art-caption art-caption-top">UN MINIJUEGO ÚNICO · CADA FESTIVO</span>
            <span className="art-caption art-caption-bottom"><strong>19</strong><span>territorios,<br />un mismo latido.</span></span>
            <span className="art-year-stamp">EDICIÓN<br /><strong>{viewYear}</strong></span>
          </div>
        </section>

        <section className="calendar-section" id="calendario" aria-labelledby="calendar-heading">
          <div className="section-heading-row">
            <div className="section-heading-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> AGENDA VIVA</p>
              <h2 id="calendar-heading">Busca tu próxima <em>fiesta.</em></h2>
              <p>Toca cualquier festivo del calendario para abrir al instante su minijuego interactivo.</p>
            </div>
            <div className="calendar-filters">
              <label className="filter-control territory-filter">
                <span>TERRITORIO</span>
                <span className="select-wrap">
                  <MapPin size={15} />
                  <select value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Selecciona una comunidad autónoma">
                    {REGIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                  <ChevronDown size={14} />
                </span>
              </label>
              <label className="filter-control year-filter">
                <span>AÑO</span>
                <span className="select-wrap year-select-wrap">
                  <select value={viewYear} onChange={changeYear} aria-label="Selecciona un año">
                    {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <ChevronDown size={14} />
                </span>
              </label>
            </div>
          </div>

          <div className="scope-note">
            <span className="scope-note-icon"><Sparkles size={13} /></span>
            <span>
              {region === 'all'
                ? 'Vista de toda España: festivos nacionales y grandes celebraciones con minijuego propio. Elige una comunidad para sumar sus minijuegos autonómicos.'
                : `Vista de ${regionLabel}: festivos nacionales, celebraciones populares y minijuegos autonómicos de este territorio.`}
            </span>
            <span className="scope-note-count">
              {completedCount > 0 ? `${completedCount}/${yearHolidays.length} SUPERADOS` : `${yearHolidays.length} MINIJUEGOS`}
            </span>
          </div>

          <div className="calendar-layout">
            <div className="calendar-main-column">
              <div className="calendar-toolbar">
                <div>
                  <p className="month-overline">CALENDARIO · {region === 'all' ? 'ESPAÑA' : regionLabel.toUpperCase()}</p>
                  <h3>{capitalize(monthName)} <span>{viewYear}</span></h3>
                </div>
                <div className="month-controls" aria-label="Cambiar de mes">
                  <button type="button" className="month-arrow" aria-label="Mes anterior" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button>
                  <button type="button" className="month-today" onClick={goToToday}>Hoy</button>
                  <button type="button" className="month-arrow" aria-label="Mes siguiente" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button>
                </div>
              </div>

              <div className="calendar-surface">
                <div className="weekday-row" aria-hidden="true">
                  {WEEKDAY_LABELS.map((day) => <span key={day}>{day}</span>)}
                </div>
                <div className="days-grid">
                  {monthCells.map((cell) => {
                    const cellEvents = holidaysByDate.get(cell.iso) ?? [];
                    const event = cellEvents[0];
                    const isToday = cell.iso === TODAY_ISO;
                    const isSelected = cell.iso === selectedISO;
                    const isBeaten = event && records[event.id]?.won;
                    const labelClass = event?.scope === 'regional'
                      ? 'regional-label'
                      : event?.scope === 'popular'
                        ? 'popular-label'
                        : 'national-label';
                    const classes = [
                      'calendar-day',
                      cell.inMonth ? '' : 'day-outside',
                      isToday ? 'day-today' : '',
                      isSelected ? 'day-selected' : '',
                      event ? 'day-holiday' : '',
                    ].filter(Boolean).join(' ');
                    const accessibleLabel = `${formatLongDate(cell.iso)}${cellEvents.length ? `. Festivo: ${cellEvents.map((item) => item.name).join(', ')}. Jugar ${event.game.title}.` : ''}`;
                    return (
                      <button
                        className={classes}
                        key={cell.iso}
                        type="button"
                        onClick={() => handleCellClick(cell)}
                        aria-label={accessibleLabel}
                        aria-pressed={isSelected}
                        title={event ? `Jugar: ${event.game.title} (${event.name})` : formatLongDate(cell.iso)}
                      >
                        <span className="day-topline">
                          <span className="day-number">{cell.day}</span>
                          {isToday && <span className="today-marker">HOY</span>}
                          {!isToday && isBeaten && <span className="day-won-star" aria-hidden="true">★</span>}
                          {cellEvents.length > 1 && <span className="extra-event-count">+{cellEvents.length - 1}</span>}
                        </span>
                        {event ? (
                          <span className={`day-event-label ${labelClass}`}>
                            <span className="day-event-dot" />
                            <span className="day-event-text">{event.shortName}</span>
                            <Sparkles size={10} className="day-event-spark" />
                          </span>
                        ) : <span className="day-empty-space" />}
                      </button>
                    );
                  })}
                </div>
                <div className="calendar-bottomline">
                  <div className="calendar-legend">
                    <span><i className="legend-dot legend-national" />Nacional</span>
                    <span><i className="legend-dot legend-popular" />Celebración</span>
                    {region !== 'all' && <span><i className="legend-dot legend-regional" />Autonómico</span>}
                    <span><i className="legend-dot legend-today" />Hoy</span>
                  </div>
                  <span className="month-event-count">{monthHolidays.length} {monthHolidays.length === 1 ? 'minijuego este mes' : 'minijuegos este mes'}</span>
                </div>
              </div>

              <div className="month-events">
                <div className="month-events-heading">
                  <span>EN {monthName.toUpperCase()}</span>
                  <span>{monthHolidays.length ? 'Toca una fecha para jugar ahora' : 'Explora otro mes o comunidad'}</span>
                </div>
                {monthHolidays.length ? (
                  <div className="month-event-list">
                    {monthHolidays.map((holiday) => (
                      <button type="button" className="month-event-chip" key={holiday.id} onClick={() => openHolidayGame(holiday)}>
                        <span className="chip-day">{Number(holiday.date.slice(-2))}</span>
                        <span className="chip-event-icon">{holiday.icon}</span>
                        <span className="chip-name">{holiday.shortName} · <em>{holiday.game.title}</em></span>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty-month-note">No hay fechas señaladas en {monthName} para {regionLabel}. Cambia de mes, elige otra comunidad o baja al salón de minijuegos.</p>
                )}
              </div>
            </div>

            <aside className="celebration-column" aria-label="Detalle de la próxima festividad">
              {focusHoliday ? (
                <>
                  <article className="spotlight-card" style={{ '--event-color': focusHoliday.color }}>
                    <div className="spotlight-orbit spotlight-orbit-a" />
                    <div className="spotlight-orbit spotlight-orbit-b" />
                    <div className="spotlight-topline">
                      <span>{focusIsSelected ? 'FECHA SELECCIONADA' : 'SIGUIENTE EN EL CALENDARIO'}</span>
                      <Gamepad2 size={15} />
                    </div>
                    <div className="spotlight-date-row">
                      <div className="spotlight-date">
                        <span>{shortMonth(focusHoliday.date)}</span>
                        <strong>{Number(focusHoliday.date.slice(-2))}</strong>
                      </div>
                      <div className="spotlight-title-wrap">
                        <span className="spotlight-scope">{scopeBadgeLabel(focusHoliday)}</span>
                        <h3>{focusHoliday.name}</h3>
                      </div>
                    </div>
                    {!focusIsSelected && selectedISO !== TODAY_ISO && (
                      <p className="selected-date-context">Después del {formatLongDate(selectedISO)}.</p>
                    )}
                    <p className="spotlight-description">
                      <strong className="spotlight-game-name">{focusHoliday.icon} {focusHoliday.game.title}:</strong> {focusHoliday.game.instruction}
                    </p>
                    <div className="spotlight-meta">
                      <span><Clock3 size={13} />{countdownLabel(focusHoliday.date)}</span>
                      <span className="game-type-pill">{focusMeta?.badge}</span>
                    </div>
                    <button className="spotlight-game-button" type="button" onClick={() => setActiveGame(focusHoliday)}>
                      <span><Sparkles size={16} /> Jugar «{focusHoliday.game.title}»</span>
                      <ArrowUpRight size={17} />
                    </button>
                    {selectedEvents.length > 1 && (
                      <div className="spotlight-extra-games">
                        {selectedEvents.slice(1).map((alt) => (
                          <button
                            key={alt.id}
                            type="button"
                            className="spotlight-alt-button"
                            onClick={() => setActiveGame(alt)}
                          >
                            <span>{alt.icon} También hoy: {alt.shortName} · «{alt.game.title}»</span>
                            <ArrowUpRight size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="spotlight-footer-note">
                      {records[focusHoliday.id]?.won
                        ? `Superado · ${'★'.repeat(clampStars(records[focusHoliday.id].stars))} · Récord: ${records[focusHoliday.id].bestScore ?? 0}`
                        : 'Minijuego interactivo diseñado a medida para esta fecha.'}
                    </span>
                  </article>

                  <article className="tradition-card" id="tradiciones">
                    <div className="tradition-topline">
                      <span>UNA TRADICIÓN PARA RECORDAR</span>
                      <span className="tradition-icon">{focusHoliday.icon}</span>
                    </div>
                    <h3>Lo que hace especial<br />este día.</h3>
                    <p>{focusHoliday.tradition}</p>
                    <div className="tradition-source"><span className="tradition-dash" />{focusHoliday.shortName}</div>
                  </article>
                </>
              ) : null}
              <div className="side-stat-row">
                <div><span>FESTIVOS {viewYear}</span><strong>{nationalCount}<small> nacionales</small></strong></div>
                <div><span>TU COLECCIÓN</span><strong>{completedCount}<small> / {yearHolidays.length} jugados</small></strong></div>
              </div>
            </aside>
          </div>

          <section className="arcade-gallery" id="minijuegos" aria-labelledby="gallery-heading">
            <div className="gallery-header">
              <div>
                <p className="eyebrow"><span className="eyebrow-dot" /> SALÓN DE MINIJUEGOS · {regionLabel.toUpperCase()}</p>
                <h3 id="gallery-heading">Un juego interactivo para <em>cada festivo.</em></h3>
              </div>
              <div className="gallery-filters" role="tablist" aria-label="Filtrar minijuegos por estilo">
                {GALLERY_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={galleryFilter === filter.id}
                    className={`gallery-filter-pill ${galleryFilter === filter.id ? 'is-active' : ''}`}
                    onClick={() => setGalleryFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="gallery-grid">
              {filteredGallery.map((holiday) => {
                const meta = GAME_TYPE_META[holiday.game.type] ?? { badge: 'ARCADE' };
                const rec = records[holiday.id];
                return (
                  <button
                    key={holiday.id}
                    type="button"
                    className={`gallery-card ${rec?.won ? 'is-completed' : ''}`}
                    style={{ '--card-accent': holiday.color }}
                    onClick={() => openHolidayGame(holiday)}
                  >
                    <div className="gallery-card-top">
                      <span className="gallery-date">{Number(holiday.date.slice(-2))} {shortMonth(holiday.date).toUpperCase()}</span>
                      <span className="gallery-badge">{meta.badge}</span>
                    </div>
                    <div className="gallery-card-main">
                      <span className="gallery-icon" aria-hidden="true">{holiday.icon}</span>
                      <div className="gallery-copy">
                        <span className="gallery-holiday">{holiday.shortName}</span>
                        <strong>{holiday.game.title}</strong>
                      </div>
                    </div>
                    <div className="gallery-card-foot">
                      <span className="gallery-stars">
                        {clampStars(rec?.stars) > 0
                          ? '★'.repeat(clampStars(rec.stars)) + '☆'.repeat(3 - clampStars(rec.stars))
                          : 'Jugar ahora'}
                      </span>
                      <ArrowUpRight size={14} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <p className="calendar-disclaimer">
            <span>NOTA</span> Incluye los festivos nacionales, celebraciones populares destacadas y fechas autonómicas de referencia. Los festivos trasladados y locales pueden variar según el calendario laboral oficial de cada comunidad y municipio.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#inicio">festeja<span>.</span></a>
        <p>Un calendario para vivirlo y jugarlo, no solo mirarlo.</p>
        <a href="#calendario">Volver al calendario <ArrowUpRight size={13} /></a>
      </footer>

      {activeGame && (
        <GameModal
          key={activeGame.id}
          holiday={activeGame}
          previousRecord={records[activeGame.id]}
          onRecord={recordOutcome}
          onClose={closeGame}
        />
      )}
    </div>
  );
}

function GameModal({ holiday, previousRecord, onRecord, onClose }) {
  const [result, setResult] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [round, setRound] = useState(0);
  const [muted, setMuted] = useState(() => isSoundMuted());
  const modalRef = useRef(null);
  const game = holiday.game;
  const meta = GAME_TYPE_META[game.type] ?? { badge: 'ARCADE', goalLabel: 'RETO' };

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const baselineBestRef = useRef(
    Number.isFinite(Number(previousRecord?.bestScore)) ? Number(previousRecord.bestScore) : 0,
  );

  const handleComplete = useCallback((outcome) => {
    const score = Number.isFinite(Number(outcome.score)) ? Math.max(0, Math.round(Number(outcome.score))) : 0;
    const stars = clampStars(outcome.stars);
    const normalized = { ...outcome, score, stars };
    const beatRecord = Boolean(normalized.won && score > baselineBestRef.current);
    if (score > baselineBestRef.current) baselineBestRef.current = score;
    onRecord(holiday.id, normalized);
    setIsNewRecord(beatRecord);
    setResult(normalized);
  }, [holiday.id, onRecord]);

  function toggleMute() {
    const next = setSoundMuted(!muted);
    setMuted(next);
    if (!next) sfx.tap();
  }

  function handleModalKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll('button:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function restart() {
    setResult(null);
    setIsNewRecord(false);
    setRound((value) => value + 1);
  }

  const scopeText = holiday.scope === 'national'
    ? 'ESPAÑA · NACIONAL'
    : holiday.scope === 'popular'
      ? 'CELEBRACIÓN POPULAR'
      : holiday.regionLabel.toUpperCase();

  return (
    <div
      className="game-backdrop"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={modalRef}
        tabIndex={-1}
        className="game-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-title"
        onKeyDown={handleModalKeyDown}
        style={{ '--event-color': holiday.color }}
      >
        <div className="game-poster">
          <div className="game-poster-orbit game-poster-orbit-one" />
          <div className="game-poster-orbit game-poster-orbit-two" />
          <div className="game-modal-brand">
            <span className="brand-mark brand-mark-small"><span /><span /><span /><i /></span>
            <span>festeja<span className="brand-period">.</span></span>
          </div>
          <span className="game-poster-overline">MINIJUEGO · {meta.badge}</span>
          <div className="game-poster-symbol" aria-hidden="true">{holiday.icon}</div>
          <div className="game-poster-copy">
            <span>{formatLongDate(holiday.date)}</span>
            <h2>{holiday.name}</h2>
            <p>{holiday.description}</p>
          </div>
          <div className="game-poster-foot">
            <span>{scopeText}</span>
            <span>{previousRecord?.bestScore ? `RÉCORD ${previousRecord.bestScore}` : meta.goalLabel}</span>
          </div>
        </div>

        <div className="game-content">
          <div className="game-content-topline">
            <div>
              <span className="game-content-kicker">MINIJUEGO INTERACTIVO</span>
              <span className="game-content-time"><Gamepad2 size={13} />{meta.badge}</span>
            </div>
            <div className="game-top-actions">
              <button
                type="button"
                className="game-icon-btn"
                onClick={toggleMute}
                aria-label={muted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
                title={muted ? 'Activar sonido' : 'Silenciar sonido'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button type="button" className="game-close" onClick={onClose} aria-label="Cerrar minijuego">
                <X size={18} />
              </button>
            </div>
          </div>

          {result ? (
            <div className="game-result" key="complete">
              <div className={`result-medal ${result.won ? '' : 'result-medal-retry'}`}>
                {result.won ? <Trophy size={30} /> : <RotateCcw size={26} />}
              </div>
              <div className="result-stars" aria-label={`${result.stars ?? 0} de 3 estrellas`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={22} className={n <= (result.stars ?? 0) ? 'star-filled' : 'star-empty'} />
                ))}
              </div>
              <span className="game-content-kicker">
                {result.won ? (isNewRecord ? '¡VICTORIA Y NUEVO RÉCORD!' : '¡MINIJUEGO SUPERADO!') : '¡CASI LO TIENES!'}
              </span>
              <h3 id="game-title">
                {result.won
                  ? (result.stars === 3 ? '¡Lo has bordado!' : '¡Gran partida!')
                  : '¡A por la revancha!'}
              </h3>
              <p>{result.summary}</p>
              <div className="result-score">
                <strong>{result.score}</strong>
                <span>{result.unit}</span>
              </div>
              <div className="result-actions">
                <button type="button" className="game-primary-button" onClick={restart}>
                  <RotateCcw size={14} /> {result.won ? 'Jugar otra vez' : 'Reintentar ahora'}
                </button>
                <button type="button" className="game-secondary-button" onClick={onClose}>
                  Volver al calendario <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="game-heading">
                <span className="game-step-label">{meta.badge} · {holiday.shortName.toUpperCase()}</span>
                <h3 id="game-title">{game.title}</h3>
                <p>{game.instruction}</p>
              </div>
              <GameStage
                key={`${holiday.id}-${round}`}
                game={game}
                onComplete={handleComplete}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
