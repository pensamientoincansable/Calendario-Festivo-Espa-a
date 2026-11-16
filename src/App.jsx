import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  formatLongDate,
  getDaysBetween,
  getHolidays,
  getMonthCells,
  getMonthName,
  isoDate,
  REGIONS,
} from './calendar.js';

const TODAY = new Date();
const TODAY_ISO = TODAY.toISOString().slice(0, 10);
const WEEKDAY_LABELS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

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

function gameTypeLabel(type) {
  if (type === 'memory') return 'memoria';
  if (type === 'order') return 'orden';
  return 'trivial';
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function makeDeck(pairs) {
  return shuffle(pairs.flatMap((pair, pairIndex) => pair.map((card, side) => ({
    ...card,
    pairId: pairIndex,
    id: `${pairIndex}-${side}`,
  }))));
}

function shuffleSteps(steps) {
  const mixed = shuffle(steps);
  if (mixed.every((step, index) => step.id === steps[index].id) && mixed.length > 1) {
    return [...mixed.slice(1), mixed[0]];
  }
  return mixed;
}

function useElapsed(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function App() {
  const initialYear = TODAY.getUTCFullYear();
  const initialMonth = TODAY.getUTCMonth();
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [selectedISO, setSelectedISO] = useState(TODAY_ISO);
  const [region, setRegion] = useState('all');
  const [activeGame, setActiveGame] = useState(null);
  const closeGame = useCallback(() => setActiveGame(null), []);

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
      group.sort((a, b) => (a.scope === b.scope ? a.name.localeCompare(b.name) : a.scope === 'national' ? -1 : 1));
      map.set(holiday.date, group);
    });
    return map;
  }, [allVisibleHolidays]);
  const monthCells = useMemo(() => getMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthHolidays = useMemo(
    () => yearHolidays.filter((holiday) => holiday.date.slice(0, 7) === isoDate(viewYear, viewMonth + 1, 1).slice(0, 7)),
    [yearHolidays, viewYear, viewMonth],
  );

  const selectedEvents = holidaysByDate.get(selectedISO) ?? [];
  const selectedHoliday = selectedEvents[0] ?? null;
  const upcomingHoliday = allVisibleHolidays.find((holiday) => holiday.date > selectedISO) ?? yearHolidays[0] ?? null;
  const focusHoliday = selectedHoliday ?? upcomingHoliday;
  const focusIsSelected = Boolean(selectedHoliday);
  const regionLabel = REGIONS.find((item) => item.id === region)?.label ?? 'Toda España';
  const nationalCount = yearHolidays.filter((holiday) => holiday.scope === 'national').length;
  const regionalCount = yearHolidays.filter((holiday) => holiday.scope === 'regional').length;

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
    setViewYear(TODAY.getUTCFullYear());
    setViewMonth(TODAY.getUTCMonth());
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
            <h1 id="intro-title">El año también<br /><em>se celebra.</em></h1>
            <p className="intro-description">Encuentra los días que nos reúnen. Abre una fecha festiva para descubrir su historia y jugar a su pequeño reto.</p>
            <a className="intro-link" href="#calendario">Explorar el calendario <ArrowRight size={16} /></a>
          </div>
          <div className="intro-art" aria-label="Diecinueve comunidades y ciudades autónomas, un mismo calendario">
            <div className="art-grain" />
            <div className="art-orbit art-orbit-one" />
            <div className="art-orbit art-orbit-two" />
            <div className="art-sun-disc"><span className="art-sun-symbol">✳</span><span className="art-sun-dot" /></div>
            <span className="art-star art-star-one">✦</span>
            <span className="art-star art-star-two">✧</span>
            <span className="art-caption art-caption-top">UN PAÍS · MUCHAS FORMAS DE CELEBRAR</span>
            <span className="art-caption art-caption-bottom"><strong>19</strong><span>territorios,<br />un mismo latido.</span></span>
            <span className="art-year-stamp">EDICIÓN<br /><strong>{viewYear}</strong></span>
          </div>
        </section>

        <section className="calendar-section" id="calendario" aria-labelledby="calendar-heading">
          <div className="section-heading-row">
            <div className="section-heading-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> AGENDA VIVA</p>
              <h2 id="calendar-heading">Busca tu próxima <em>fiesta.</em></h2>
              <p>Un calendario para mirar, descubrir y celebrar a tu manera.</p>
            </div>
            <div className="calendar-filters">
              <label className="filter-control territory-filter">
                <span>TERRITORIO</span>
                <span className="select-wrap"><MapPin size={15} /><select value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Selecciona una comunidad autónoma">
                  {REGIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select><ChevronDown size={14} /></span>
              </label>
              <label className="filter-control year-filter">
                <span>AÑO</span>
                <span className="select-wrap year-select-wrap"><select value={viewYear} onChange={changeYear} aria-label="Selecciona un año">
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select><ChevronDown size={14} /></span>
              </label>
            </div>
          </div>

          <div className="scope-note">
            <span className="scope-note-icon"><Sparkles size={13} /></span>
            <span>{region === 'all' ? 'Vista nacional: muestra los festivos comunes a toda España. Elige un territorio para sumar sus fechas autonómicas.' : `Vista de ${regionLabel}: festivos nacionales y fechas autonómicas de referencia.`}</span>
            <span className="scope-note-count">{nationalCount + regionalCount} FECHAS</span>
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
                    const classes = [
                      'calendar-day',
                      cell.inMonth ? '' : 'day-outside',
                      isToday ? 'day-today' : '',
                      isSelected ? 'day-selected' : '',
                      event ? 'day-holiday' : '',
                    ].filter(Boolean).join(' ');
                    const accessibleLabel = `${formatLongDate(cell.iso)}${cellEvents.length ? `. Festivo: ${cellEvents.map((item) => item.name).join(', ')}. Abrir minijuego.` : ''}`;
                    return (
                      <button
                        className={classes}
                        key={cell.iso}
                        type="button"
                        onClick={() => handleCellClick(cell)}
                        aria-label={accessibleLabel}
                        aria-pressed={isSelected}
                        title={cellEvents.length ? `Abrir reto: ${cellEvents.map((item) => item.name).join(' · ')}` : formatLongDate(cell.iso)}
                      >
                        <span className="day-topline">
                          <span className="day-number">{cell.day}</span>
                          {isToday && <span className="today-marker">HOY</span>}
                          {cellEvents.length > 1 && <span className="extra-event-count">+{cellEvents.length - 1}</span>}
                        </span>
                        {event ? (
                          <span className={`day-event-label ${event.scope === 'regional' ? 'regional-label' : 'national-label'}`}>
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
                    {region !== 'all' && <span><i className="legend-dot legend-regional" />Autonómico</span>}
                    <span><i className="legend-dot legend-today" />Hoy</span>
                  </div>
                  <span className="month-event-count">{monthHolidays.length} {monthHolidays.length === 1 ? 'fecha festiva' : 'fechas festivas'}</span>
                </div>
              </div>

              <div className="month-events">
                <div className="month-events-heading">
                  <span>EN {monthName.toUpperCase()}</span>
                  <span>{monthHolidays.length ? 'Toca una fecha para abrir su reto' : 'Un mes para seguir explorando'}</span>
                </div>
                {monthHolidays.length ? (
                  <div className="month-event-list">
                    {monthHolidays.map((holiday) => (
                      <button type="button" className="month-event-chip" key={holiday.id} onClick={() => openHolidayGame(holiday)}>
                        <span className="chip-day">{Number(holiday.date.slice(-2))}</span>
                        <span className="chip-event-icon">{holiday.icon}</span>
                        <span className="chip-name">{holiday.shortName}</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="empty-month-note">Todavía no hay fechas festivas en este mes para {regionLabel}. Cambia de mes o explora otro territorio.</p>
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
                      <span>{focusIsSelected ? 'FECHA FESTIVA SELECCIONADA' : 'SIGUIENTE EN EL CALENDARIO'}</span>
                      <Sparkles size={15} />
                    </div>
                    <div className="spotlight-date-row">
                      <div className="spotlight-date"><span>{shortMonth(focusHoliday.date)}</span><strong>{Number(focusHoliday.date.slice(-2))}</strong></div>
                      <div className="spotlight-title-wrap">
                        <span className="spotlight-scope">{focusHoliday.scope === 'national' ? 'FESTIVO NACIONAL' : `AUTONÓMICO · ${focusHoliday.regionLabel.toUpperCase()}`}</span>
                        <h3>{focusHoliday.name}</h3>
                      </div>
                    </div>
                    {!focusIsSelected && selectedISO !== TODAY_ISO && <p className="selected-date-context">Después del {formatLongDate(selectedISO)}.</p>}
                    <p className="spotlight-description">{focusHoliday.description}</p>
                    <div className="spotlight-meta">
                      <span><Clock3 size={13} />{countdownLabel(focusHoliday.date)}</span>
                      <span className="game-type-pill">RETO DE {gameTypeLabel(focusHoliday.game.type).toUpperCase()}</span>
                    </div>
                    <button className="spotlight-game-button" type="button" onClick={() => setActiveGame(focusHoliday)}>
                      <span><Sparkles size={16} /> Jugar el minijuego</span><ArrowUpRight size={17} />
                    </button>
                    <span className="spotlight-footer-note">Un reto creado para esta fecha, no para cualquier día.</span>
                  </article>

                  <article className="tradition-card" id="tradiciones">
                    <div className="tradition-topline"><span>UNA TRADICIÓN PARA RECORDAR</span><span className="tradition-icon">{focusHoliday.icon}</span></div>
                    <h3>Lo que hace especial<br />este día.</h3>
                    <p>{focusHoliday.tradition}</p>
                    <div className="tradition-source"><span className="tradition-dash" />{focusHoliday.shortName}</div>
                  </article>
                </>
              ) : (
                <div className="spotlight-card spotlight-empty">
                  <Sparkles size={22} />
                  <h3>Un año lleno de historias.</h3>
                  <p>Elige una fecha festiva para descubrir su tradición y jugar a su reto.</p>
                </div>
              )}
              <div className="side-stat-row">
                <div><span>EN {viewYear}</span><strong>{nationalCount}<small> nacionales</small></strong></div>
                <div><span>ESTE MES</span><strong>{monthHolidays.length}<small> {monthHolidays.length === 1 ? 'fecha' : 'fechas'}</small></strong></div>
              </div>
            </aside>
          </div>

          <p className="calendar-disclaimer"><span>NOTA</span> Incluye festivos nacionales y fechas autonómicas de referencia. Los festivos trasladados y locales pueden variar: confirma el calendario laboral oficial de tu comunidad y municipio.</p>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#inicio">festeja<span>.</span></a>
        <p>Un calendario para vivirlo, no solo mirarlo.</p>
        <a href="#calendario">Volver al calendario <ArrowUpRight size={13} /></a>
      </footer>

      {activeGame && <GameModal key={activeGame.id} holiday={activeGame} onClose={closeGame} />}
    </div>
  );
}

function GameModal({ holiday, onClose }) {
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const closeButtonRef = useRef(null);
  const game = holiday.game;

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  function handleModalKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(event.currentTarget.querySelectorAll('button:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function restart() {
    setCompleted(false);
    setScore(0);
    setRound((value) => value + 1);
  }

  const typeLabel = game.type === 'memory' ? 'MEMORIA' : game.type === 'order' ? 'ORDEN' : 'TRIVIA';
  const total = game.type === 'memory' ? game.pairs.length : game.type === 'order' ? 1 : game.questions.length;

  return (
    <div className="game-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="game-title" onKeyDown={handleModalKeyDown} style={{ '--event-color': holiday.color }}>
        <div className="game-poster">
          <div className="game-poster-orbit game-poster-orbit-one" />
          <div className="game-poster-orbit game-poster-orbit-two" />
          <div className="game-modal-brand"><span className="brand-mark brand-mark-small"><span /><span /><span /><i /></span><span>festeja<span className="brand-period">.</span></span></div>
          <span className="game-poster-overline">RETO FESTIVO · {typeLabel}</span>
          <div className="game-poster-symbol" aria-hidden="true">{holiday.icon}</div>
          <div className="game-poster-copy">
            <span>{formatLongDate(holiday.date)}</span>
            <h2>{holiday.name}</h2>
            <p>{holiday.description}</p>
          </div>
          <div className="game-poster-foot"><span>{holiday.scope === 'national' ? 'ESPAÑA · NACIONAL' : holiday.regionLabel.toUpperCase()}</span><span>{String(total).padStart(2, '0')} {game.type === 'quiz' ? 'PISTAS' : game.type === 'memory' ? 'PAREJAS' : 'MOMENTOS'}</span></div>
        </div>

        <div className="game-content">
          <div className="game-content-topline">
            <div><span className="game-content-kicker">TU PEQUEÑO RETO</span><span className="game-content-time"><Clock3 size={13} />3 MIN</span></div>
            <button ref={closeButtonRef} type="button" className="game-close" onClick={onClose} aria-label="Cerrar minijuego"><X size={18} /></button>
          </div>

          {completed ? (
            <div className="game-result" key="complete">
              <div className="result-medal"><Trophy size={30} /></div>
              <span className="game-content-kicker">RETO COMPLETADO</span>
              <h3 id="game-title">{score === total ? '¡Lo has bordado!' : '¡Buen recorrido!'}</h3>
              <p>{score === total ? 'Has resuelto todas las pistas de esta fecha.' : 'Cada juego deja una historia nueva. ¿Te animas a mejorar tu resultado?'}</p>
              <div className="result-score"><strong>{score}<span> / {total}</span></strong><span>{game.type === 'memory' ? 'parejas reunidas' : game.type === 'order' ? 'secuencia correcta' : 'respuestas acertadas'}</span></div>
              <div className="result-actions">
                <button type="button" className="game-primary-button" onClick={onClose}>Volver al calendario <ArrowUpRight size={16} /></button>
                <button type="button" className="game-secondary-button" onClick={restart}><RotateCcw size={14} /> Jugar otra vez</button>
              </div>
            </div>
          ) : (
            <>
              <div className="game-heading">
                <span className="game-step-label">{game.type === 'quiz' ? 'TRIVIA · 03 PISTAS' : `RETO · ${typeLabel}`}</span>
                <h3 id="game-title">{game.title}</h3>
                <p>{game.instruction}</p>
              </div>
              {game.type === 'memory' && <MemoryGame key={`${holiday.id}-${round}`} game={game} onProgress={setScore} onComplete={() => { setScore(total); setCompleted(true); }} />}
              {game.type === 'order' && <OrderGame key={`${holiday.id}-${round}`} game={game} onComplete={() => { setScore(1); setCompleted(true); }} />}
              {game.type === 'quiz' && <QuizGame key={`${holiday.id}-${round}`} game={game} onProgress={setScore} onComplete={(finalScore) => { setScore(finalScore); setCompleted(true); }} />}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function MemoryGame({ game, onProgress, onComplete }) {
  const [deck, setDeck] = useState(() => makeDeck(game.pairs));
  const [openCards, setOpenCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const timeoutRef = useRef(null);
  const elapsed = useElapsed(true);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  function chooseCard(card) {
    if (openCards.length === 2 || openCards.some((item) => item.id === card.id) || matchedPairs.includes(card.pairId)) return;
    const nextOpenCards = [...openCards, card];
    setOpenCards(nextOpenCards);
    if (nextOpenCards.length < 2) return;

    setMoves((value) => value + 1);
    if (nextOpenCards[0].pairId === nextOpenCards[1].pairId) {
      const nextMatches = [...matchedPairs, card.pairId];
      setMatchedPairs(nextMatches);
      setOpenCards([]);
      onProgress(nextMatches.length);
      if (nextMatches.length === game.pairs.length) onComplete();
    } else {
      timeoutRef.current = window.setTimeout(() => setOpenCards([]), 780);
    }
  }

  function reset() {
    window.clearTimeout(timeoutRef.current);
    setDeck(makeDeck(game.pairs));
    setOpenCards([]);
    setMatchedPairs([]);
    setMoves(0);
    onProgress(0);
  }

  return (
    <div className="memory-game">
      <div className="game-stats-line"><span>PAREJAS <strong>{matchedPairs.length}/{game.pairs.length}</strong></span><span>MOVIMIENTOS <strong>{moves}</strong></span><span>TIEMPO <strong>{elapsed}</strong></span><button type="button" onClick={reset} aria-label="Reiniciar el juego de memoria"><RotateCcw size={14} /></button></div>
      <div className="memory-grid">
        {deck.map((card, index) => {
          const isFaceUp = openCards.some((item) => item.id === card.id) || matchedPairs.includes(card.pairId);
          const isMatched = matchedPairs.includes(card.pairId);
          return (
            <button
              key={card.id}
              type="button"
              className={`memory-card ${isFaceUp ? 'memory-card-open' : ''} ${isMatched ? 'memory-card-matched' : ''}`}
              onClick={() => chooseCard(card)}
              aria-label={isFaceUp ? `${card.label}${isMatched ? ', pareja encontrada' : ''}` : `Carta ${index + 1}, boca abajo`}
              aria-pressed={isFaceUp}
              disabled={isMatched}
            >
              <span className="memory-card-back">✳</span>
              <span className="memory-card-front"><span>{card.icon}</span><small>{card.label}</small></span>
            </button>
          );
        })}
      </div>
      <p className="game-hint"><span className="hint-sparkle">✦</span> Dos cartas iguales se quedan encendidas. ¿Puedes encontrarlas todas?</p>
    </div>
  );
}

function OrderGame({ game, onComplete }) {
  const [steps, setSteps] = useState(() => shuffleSteps(game.steps));
  const [message, setMessage] = useState('');
  const elapsed = useElapsed(true);

  function moveStep(index, direction) {
    const destination = index + direction;
    if (destination < 0 || destination >= steps.length) return;
    setMessage('');
    setSteps((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  }

  function checkOrder() {
    const isCorrect = steps.every((step, index) => step.id === game.steps[index].id);
    if (isCorrect) onComplete();
    else setMessage('Casi. Piensa en cómo empieza y termina esta tradición.');
  }

  function resetOrder() {
    setSteps(shuffleSteps(game.steps));
    setMessage('');
  }

  return (
    <div className="order-game">
      <div className="game-stats-line"><span>SECUENCIA <strong>{steps.length} PASOS</strong></span><span>TIEMPO <strong>{elapsed}</strong></span><button type="button" onClick={resetOrder} aria-label="Mezclar de nuevo la secuencia"><RotateCcw size={14} /></button></div>
      <ol className="order-list">
        {steps.map((step, index) => (
          <li key={step.id} className="order-step">
            <span className="order-step-number">0{index + 1}</span>
            <span className="order-step-icon">{step.icon}</span>
            <span className="order-step-label">{step.label}</span>
            <span className="order-controls">
              <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} aria-label={`Mover ${step.label} hacia arriba`}><ArrowUp size={14} /></button>
              <button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} aria-label={`Mover ${step.label} hacia abajo`}><ArrowDown size={14} /></button>
            </span>
          </li>
        ))}
      </ol>
      {message && <p className="order-feedback" role="status">{message}</p>}
      <button type="button" className="game-primary-button check-order-button" onClick={checkOrder}>Comprobar mi orden <Check size={16} /></button>
      <p className="game-hint"><span className="hint-sparkle">✦</span> Usa las flechas para colocar cada momento en su sitio.</p>
    </div>
  );
}

function QuizGame({ game, onProgress, onComplete }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const elapsed = useElapsed(true);
  const question = game.questions[questionIndex];

  function selectAnswer(index) {
    if (answered) return;
    const correct = index === question.answer;
    setChoice(index);
    setAnswered(true);
    if (correct) {
      const nextScore = score + 1;
      setScore(nextScore);
      onProgress(nextScore);
    }
  }

  function continueQuiz() {
    if (questionIndex === game.questions.length - 1) {
      onComplete(score);
      return;
    }
    setQuestionIndex((value) => value + 1);
    setChoice(null);
    setAnswered(false);
  }

  return (
    <div className="quiz-game">
      <div className="game-stats-line"><span>PISTAS <strong>0{questionIndex + 1}/0{game.questions.length}</strong></span><span>ACIERTOS <strong>{score}</strong></span><span>TIEMPO <strong>{elapsed}</strong></span></div>
      <div className="quiz-progress"><span style={{ width: `${((questionIndex + 1) / game.questions.length) * 100}%` }} /></div>
      <p className="quiz-question">{question.prompt}</p>
      <div className="quiz-options">
        {question.options.map((option, index) => {
          const isCorrect = index === question.answer;
          const isWrongChoice = answered && choice === index && !isCorrect;
          return (
            <button
              type="button"
              key={`${questionIndex}-${option}`}
              className={`quiz-option ${answered && isCorrect ? 'quiz-option-correct' : ''} ${isWrongChoice ? 'quiz-option-wrong' : ''} ${choice === index ? 'quiz-option-chosen' : ''}`}
              onClick={() => selectAnswer(index)}
              disabled={answered}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
              {answered && isCorrect && <Check size={15} />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`quiz-feedback ${choice === question.answer ? 'quiz-feedback-correct' : ''}`} role="status">
          <strong>{choice === question.answer ? '¡Correcto!' : 'La respuesta era otra.'}</strong><span>{question.explanation}</span>
        </div>
      )}
      {answered && <button type="button" className="game-primary-button quiz-next-button" onClick={continueQuiz}>{questionIndex === game.questions.length - 1 ? 'Ver resultado' : 'Siguiente pista'} <ArrowRight size={16} /></button>}
      {!answered && <p className="game-hint"><span className="hint-sparkle">✦</span> Una pista sobre la fecha, otra sobre el calendario. ¡A por las tres!</p>}
    </div>
  );
}

export default App;
