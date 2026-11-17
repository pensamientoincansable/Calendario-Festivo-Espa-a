import { useCallback, useMemo, useState } from 'react';
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
  Sparkles,
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
import GameModal from './GameModal.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useTheme } from './theme.js';
import { clampStars, loadRecords, saveRecords } from './records.js';

const TODAY = new Date();
const TODAY_YEAR = TODAY.getFullYear();
const TODAY_MONTH = TODAY.getMonth();
const TODAY_ISO = isoDate(TODAY_YEAR, TODAY_MONTH + 1, TODAY.getDate());
const WEEKDAY_LABELS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const GALLERY_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'race', label: 'Carreras', types: ['race'] },
  { id: 'cooking', label: 'Cocina', types: ['cooking'] },
  { id: 'match3', label: 'Candy Match', types: ['match3'] },
  { id: 'navidad-reyes', label: 'Navidad y Reyes', types: ['santa', 'reyes', 'chimes', 'lights'] },
  { id: 'arcade', label: 'Acción y pulso', types: ['runner', 'stacker', 'fireworks', 'catcher', 'breakout', 'candles'] },
];

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
  const [theme, chooseTheme] = useTheme();
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
      <header className="site-header" inert={activeGame ? '' : undefined}>
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
        <div className="header-actions">
          <ThemeToggle theme={theme} onChange={chooseTheme} />
          <button className="today-button" type="button" onClick={goToToday}>
            <CalendarDays size={16} strokeWidth={1.8} />
            <span>Ir a hoy</span>
            <ArrowUpRight size={14} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <main id="inicio" inert={activeGame ? '' : undefined}>
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
                    data-game-type={holiday.game.type}
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

      <footer className="site-footer" inert={activeGame ? '' : undefined}>
        <a className="footer-brand" href="#inicio">festeja<span>.</span></a>
        <p>Un calendario para vivirlo y jugarlo, no solo mirarlo.</p>
        <a href="#calendario">Volver al calendario <ArrowUpRight size={13} /></a>
      </footer>

      {activeGame && (
        <GameModal
          key={activeGame.id}
          theme={theme}
          onThemeChange={chooseTheme}
          holiday={activeGame}
          previousRecord={records[activeGame.id]}
          onRecord={recordOutcome}
          onClose={closeGame}
        />
      )}
    </div>
  );
}

export default App;
