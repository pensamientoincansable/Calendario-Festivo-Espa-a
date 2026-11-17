import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameClock, ActionButton } from './GameSession.jsx';
import { ArrowRight, Check, Flame, RotateCcw, Sparkles, Star } from 'lucide-react';
import { sfx } from '../sound.js';
import { isModalChromeTarget } from './canvasUtils.js';

function shuffleList(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const SPANISH_RECIPES_NATIONAL = [
  {
    id: 'tortilla',
    name: 'Tortilla de patatas',
    origin: 'Clásico de toda España',
    dishIcon: '🍳',
    vessel: 'Sartén de hierro',
    ingredients: [
      { id: 'patata', icon: '🥔', label: 'Patatas' },
      { id: 'huevo', icon: '🥚', label: 'Huevos camperos' },
      { id: 'aceite', icon: '🫒', label: 'Aceite de oliva' },
      { id: 'cebolla', icon: '🧅', label: 'Cebolla pochada' },
      { id: 'sal', icon: '🧂', label: 'Pizca de sal' },
    ],
    decoys: [
      { id: 'pina', icon: '🍍', label: 'Piña', quip: '¡¿Piña en la tortilla?! ¡La abuela nos deshereda!' },
      { id: 'choco', icon: '🍫', label: 'Chocolate', quip: '¡Guarda el chocolate para los churros!' },
      { id: 'sushi', icon: '🍣', label: 'Wasabi', quip: '¡Rico, pero en esta sartén mandan las patatas!' },
    ],
    technique: 'flip',
    actionTitle: '¡Dale la vuelta en su punto jugoso!',
    actionButton: '¡Voltear la sartén!',
    zoneLabel: 'JUGOSA Y DORADA',
  },
  {
    id: 'paella',
    name: 'Paella al fuego de leña',
    origin: 'Tradición mediterránea',
    dishIcon: '🥘',
    vessel: 'Paellera ancha',
    ingredients: [
      { id: 'arroz', icon: '🍚', label: 'Arroz bomba' },
      { id: 'azafran', icon: '🌼', label: 'Azafrán en hebra' },
      { id: 'pollo', icon: '🍗', label: 'Pollo dorado' },
      { id: 'judia', icon: '🫛', label: 'Judía verde' },
      { id: 'tomate', icon: '🍅', label: 'Tomate rallado' },
    ],
    decoys: [
      { id: 'ketchup', icon: '🌭', label: 'Kétchup', quip: '¡Alto ahí! El sofrito lleva tomate natural.' },
      { id: 'helado', icon: '🍦', label: 'Vainilla', quip: '¡Eso apagaría las brasas del naranjo!' },
      { id: 'donut', icon: '🍩', label: 'Glaseado', quip: '¡El único brillo aquí lo da el azafrán!' },
    ],
    technique: 'simmer',
    actionTitle: 'Controla el fuego y clava el socarrat',
    actionButton: '¡Apartar en el socarrat!',
    zoneLabel: 'SOCARRAT PERFECTO',
  },
  {
    id: 'gazpacho',
    name: 'Gazpacho andaluz fresco',
    origin: 'Huerta del sur',
    dishIcon: '🥣',
    vessel: 'Lebrillo de barro',
    ingredients: [
      { id: 'tomates', icon: '🍅', label: 'Tomate maduro' },
      { id: 'pepino', icon: '🥒', label: 'Pepino fresco' },
      { id: 'pimiento', icon: '🫑', label: 'Pimiento verde' },
      { id: 'ajo', icon: '🧄', label: 'Diente de ajo' },
      { id: 'aove', icon: '🫒', label: 'AOVE virgen extra' },
    ],
    decoys: [
      { id: 'nata', icon: '🧁', label: 'Merengue', quip: '¡El gazpacho se emulsiona solo con buen aceite!' },
      { id: 'palomitas', icon: '🍿', label: 'Palomitas', quip: '¡Como picatoste mejor pan de pueblo!' },
      { id: 'caramelo', icon: '🍬', label: 'Caramelo', quip: '¡El dulzor ya lo ponen los tomates de verano!' },
    ],
    technique: 'blend',
    actionTitle: 'Pulsa rítmicamente para emulsionar con AOVE',
    actionButton: '¡Batir y emulsionar!',
    zoneLabel: 'EMULSIÓN SEDOSA',
  },
];

export default function CookingGame({ game, onProgress, onComplete }) {
  const clock = useGameClock();
  const recipes = game.recipes ?? SPANISH_RECIPES_NATIONAL;
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [phase, setPhase] = useState('prep'); // 'prep' | 'cook' | 'plated'
  const [addedIds, setAddedIds] = useState([]);
  const [wrongIds, setWrongIds] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [dishResults, setDishResults] = useState([]);

  // Estado de la fase de cocción interactiva
  const needleRef = useRef(null);
  const kitchenRef = useRef(null);
  const [flipping, setFlipping] = useState(false);
  const [emulsionProgress, setEmulsionProgress] = useState(0);

  const recipe = recipes[recipeIndex];
  const pantry = useMemo(
    () => shuffleList([
      ...recipe.ingredients.map((item) => ({ ...item, isGood: true })),
      ...recipe.decoys.map((item) => ({ ...item, isGood: false })),
    ]),
    [recipe],
  );

  const cursorRef = useRef(12);
  const directionRef = useRef(1);
  const emulsionRef = useRef(0);
  const cookDoneRef = useRef(false);
  const flipLockRef = useRef(false);
  const timerRef = useRef(0);

  function paintCursor(value) {
    cursorRef.current = value;
    if (needleRef.current) needleRef.current.style.left = `${value}%`;
  }

  useEffect(() => {
    if (phase === 'cook') kitchenRef.current?.closest('.game-play-surface')?.focus({ preventScroll: true });
    if (phase === 'plated') kitchenRef.current?.querySelector('.cook-action-btn')?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => () => clock.clearTimeout(timerRef.current), [clock]);

  // Preparar cada nueva receta
  useEffect(() => {
    clock.clearTimeout(timerRef.current);
    setAddedIds([]);
    setWrongIds([]);
    setMistakes(0);
    setFeedback(null);
    setPhase('prep');
    setFlipping(false);
    const startPos = recipe.technique === 'blend' ? 25 : 8;
    paintCursor(startPos);
    setEmulsionProgress(0);
    cursorRef.current = startPos;
    directionRef.current = 1;
    emulsionRef.current = 0;
    cookDoneRef.current = false;
    flipLockRef.current = false;
  }, [clock, recipeIndex, recipe.technique]);

  function finishDish(cookAccuracy) {
    if (cookDoneRef.current) return;
    cookDoneRef.current = true;
    // cookAccuracy: 2 = perfecto, 1 = bueno, 0 = justo
    const rawStars = Math.max(1, Math.min(3, 1 + cookAccuracy - (mistakes >= 2 ? 1 : 0)));
    const verdict = rawStars === 3
      ? '¡En su punto exacto! De estrella Michelin.'
      : rawStars === 2
        ? '¡Riquísima! Para mojar pan sin parar.'
        : '¡Sabrosa y casera! A la próxima bordas el punto.';

    if (rawStars >= 2) sfx.gift();
    else sfx.collect(1);

    const nextResults = [...dishResults, { id: recipe.id, name: recipe.name, icon: recipe.dishIcon, stars: rawStars, verdict }];
    setDishResults(nextResults);
    const totalStars = nextResults.reduce((sum, item) => sum + item.stars, 0);
    onProgress?.(totalStars);
    setFeedback({ text: verdict, warn: false });
    setPhase('plated');
  }

  const finishDishRef = useRef(finishDish);
  finishDishRef.current = finishDish;

  // Bucle de animación para la fase de cocción
  useEffect(() => {
    if (phase !== 'cook') return undefined;
    let rafId = 0;
    let last = clock.now();
    let hudAcc = 0;

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      hudAcc += dt;

      if (recipe.technique === 'flip') {
        if (flipLockRef.current) return;
        const speed = 92 + recipeIndex * 12;
        let next = cursorRef.current + directionRef.current * speed * dt;
        if (next >= 98) {
          next = 98;
          directionRef.current = -1;
        } else if (next <= 2) {
          next = 2;
          directionRef.current = 1;
        }
        cursorRef.current = next;
        paintCursor(next);
      } else if (recipe.technique === 'simmer') {
        const speed = 30;
        const next = Math.min(100, cursorRef.current + speed * dt);
        cursorRef.current = next;
        paintCursor(next);
        if (next >= 100) {
          setFeedback({ text: '¡Uy, casi se arrebata el fuego!', warn: true });
          finishDishRef.current(0);
          return;
        }
      } else if (recipe.technique === 'blend') {
        const next = Math.max(4, cursorRef.current - 32 * dt);
        cursorRef.current = next;
        paintCursor(next);
        if (next >= 46 && next <= 86) {
          emulsionRef.current = Math.min(100, emulsionRef.current + 44 * dt);
          if (hudAcc >= 0.1) {
            hudAcc = 0;
            setEmulsionProgress(Math.round(emulsionRef.current));
          }
          if (emulsionRef.current >= 100) {
            finishDishRef.current(2);
            return;
          }
        }
      }

      rafId = clock.requestFrame(step);
    };

    rafId = clock.requestFrame(step);
    return () => clock.cancelFrame(rafId);
  }, [clock, phase, recipe.technique, recipeIndex]);

  const triggerCookRef = useRef(null);

  // Permitir barra espaciadora durante la fase de cocción
  useEffect(() => {
    if (phase !== 'cook') return undefined;
    function onKey(event) {
      if (event.repeat || clock.isPaused() || isModalChromeTarget(event)) return;
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        triggerCookRef.current?.();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock, phase]);

  function pickIngredient(item) {
    if (phase !== 'prep') return;
    if (addedIds.includes(item.id) || wrongIds.includes(item.id)) return;

    if (item.isGood) {
      sfx.sizzle();
      const nextAdded = [...addedIds, item.id];
      setAddedIds(nextAdded);
      setFeedback({ text: `¡${item.label} a la cazuela!`, warn: false });
      if (nextAdded.length === recipe.ingredients.length) {
        clock.clearTimeout(timerRef.current);
        timerRef.current = clock.setTimeout(() => {
          setFeedback(null);
          setPhase('cook');
        }, 380);
      }
    } else {
      sfx.invalid();
      setWrongIds((prev) => [...prev, item.id]);
      setMistakes((value) => value + 1);
      setFeedback({ text: item.quip, warn: true });
    }
  }

  function triggerCookAction() {
    if (phase !== 'cook' || cookDoneRef.current || flipLockRef.current) return;
    const pos = cursorRef.current;

    if (recipe.technique === 'flip') {
      flipLockRef.current = true;
      sfx.flip();
      setFlipping(true);
      const accuracy = pos >= 40 && pos <= 62 ? 2 : pos >= 26 && pos <= 76 ? 1 : 0;
      clock.clearTimeout(timerRef.current);
      timerRef.current = clock.setTimeout(() => finishDish(accuracy), 420);
    } else if (recipe.technique === 'simmer') {
      sfx.sizzle();
      const accuracy = pos >= 60 && pos <= 82 ? 2 : pos >= 46 && pos <= 91 ? 1 : 0;
      finishDish(accuracy);
    } else if (recipe.technique === 'blend') {
      sfx.tap();
      const boosted = Math.min(97, cursorRef.current + 17);
      cursorRef.current = boosted;
      paintCursor(boosted);
      if (boosted >= 46 && boosted <= 86) {
        emulsionRef.current = Math.min(100, emulsionRef.current + 9);
        setEmulsionProgress(Math.round(emulsionRef.current));
        if (emulsionRef.current >= 100) {
          finishDish(2);
        }
      }
    }
  }

  triggerCookRef.current = triggerCookAction;

  function nextRecipe() {
    if (recipeIndex < recipes.length - 1) {
      setRecipeIndex((idx) => idx + 1);
      return;
    }
    const maxStars = recipes.length * 3;
    const totalStars = dishResults.reduce((sum, item) => sum + item.stars, 0);
    const stars = totalStars >= maxStars - 1 ? 3 : totalStars >= recipes.length * 2 ? 2 : 1;
    sfx.win();
    onComplete({
      won: true,
      score: totalStars,
      maxScore: maxStars,
      stars,
      unit: 'estrellas de cocina',
      summary: `Has sacado ${recipes.map((r) => r.name.toLowerCase()).join(', ')} recién hechas de los fogones.`,
    });
  }

  function resetKitchen() {
    clock.clearTimeout(timerRef.current);
    const firstTechnique = recipes[0]?.technique;
    const startPos = firstTechnique === 'blend' ? 25 : 8;
    setDishResults([]);
    setRecipeIndex(0);
    setAddedIds([]);
    setWrongIds([]);
    setMistakes(0);
    setFeedback(null);
    setFlipping(false);
    paintCursor(startPos);
    setEmulsionProgress(0);
    cursorRef.current = startPos;
    directionRef.current = 1;
    emulsionRef.current = 0;
    cookDoneRef.current = false;
    flipLockRef.current = false;
    setPhase('prep');
    onProgress?.(0);
  }

  const sweetZone = recipe.technique === 'flip'
    ? { left: 40, width: 22 }
    : recipe.technique === 'simmer'
      ? { left: 60, width: 22 }
      : { left: 46, width: 40 };

  const addedItems = recipe.ingredients.filter((ing) => addedIds.includes(ing.id));
  const latestResult = dishResults[dishResults.length - 1];

  return (
    <div className="cook-wrap" ref={kitchenRef}>
      <div className="game-stats-line">
        <span>RECETA <strong>0{recipeIndex + 1}/0{recipes.length}</strong></span>
        <span>ESTRELLAS <strong>{dishResults.reduce((s, d) => s + d.stars, 0)}/{recipes.length * 3}</strong></span>
        <button type="button" onClick={resetKitchen} aria-label="Reiniciar cocina">
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="cook-recipe-tabs" aria-label="Menú festivo">
        {recipes.map((item, idx) => {
          const done = dishResults[idx];
          const active = idx === recipeIndex;
          return (
            <div key={item.id} className={`cook-tab ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}>
              <span>{item.dishIcon}</span>
              <small>{item.name.split(' ')[0]}</small>
              {done && <em>{'★'.repeat(done.stars)}</em>}
            </div>
          );
        })}
      </div>

      <div className="cook-stove-card">
        <div className="cook-dish-header">
          <div>
            <span className="cook-origin">{recipe.origin.toUpperCase()} · {recipe.vessel.toUpperCase()}</span>
            <h4>{recipe.name}</h4>
          </div>
          <span className="cook-step-pill">
            {phase === 'prep'
              ? `${addedIds.length}/${recipe.ingredients.length} INGREDIENTES`
              : phase === 'cook'
                ? 'AL FUEGO'
                : '¡EMPLATADO!'}
          </span>
        </div>

        <div className="cook-pan-stage">
          <div className={`cook-pan ${phase === 'cook' ? 'is-sizzling' : ''} ${flipping ? 'is-flipping' : ''} ${phase === 'plated' ? 'is-plated' : ''}`}>
            <div className="cook-steam" aria-hidden="true"><span /><span /><span /></div>
            {phase === 'plated' ? (
              <span className="cook-finished-dish" aria-hidden="true">{recipe.dishIcon}</span>
            ) : addedItems.length > 0 ? (
              <div className="cook-pan-items">
                {addedItems.map((ing) => (
                  <span key={ing.id} className="cook-pan-item" title={ing.label}>{ing.icon}</span>
                ))}
              </div>
            ) : (
              <span className="cook-pan-empty">Añade los {recipe.ingredients.length} ingredientes auténticos</span>
            )}
          </div>
          <div className="cook-pan-handle" aria-hidden="true" />
        </div>

        {phase === 'prep' && (
          <>
            <div className="cook-pantry" role="group" aria-label="Despensa de ingredientes">
              {pantry.map((item) => {
                const isAdded = addedIds.includes(item.id);
                const isWrong = wrongIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`cook-ingredient ${isAdded ? 'is-added' : ''} ${isWrong ? 'is-wrong' : ''}`}
                    onClick={() => pickIngredient(item)}
                    disabled={isAdded || isWrong}
                  >
                    <span className="cook-ing-icon">{item.icon}</span>
                    <span className="cook-ing-label">{item.label}</span>
                    {isAdded && <Check size={12} className="cook-ing-check" />}
                  </button>
                );
              })}
            </div>
            <p className={`cook-feedback ${feedback?.warn ? 'is-warn' : ''}`} role="status">
              {feedback?.text || 'Elige los ingredientes auténticos y evita los intrusos.'}
            </p>
          </>
        )}

        {phase === 'cook' && (
          <div className="cook-action-box">
            <p className="cook-action-title"><Flame size={14} /> {recipe.actionTitle}</p>
            <div className="cook-gauge" aria-label={recipe.zoneLabel}>
              <div
                className="cook-gauge-sweet"
                style={{ left: `${sweetZone.left}%`, width: `${sweetZone.width}%` }}
              >
                <span>{recipe.zoneLabel}</span>
              </div>
              <div ref={needleRef} className="cook-gauge-needle" style={{ left: `${cursorRef.current}%` }} />
            </div>
            {recipe.technique === 'blend' && (
              <div className="cook-emulsion-row">
                <span>TEXTURA SEDOSA</span>
                <div className="cook-emulsion-bar"><span style={{ width: `${emulsionProgress}%` }} /></div>
                <strong>{emulsionProgress}%</strong>
              </div>
            )}
            <ActionButton type="button" className="game-primary-button cook-action-btn" onAction={triggerCookAction}>
              <Sparkles size={15} /> {recipe.actionButton}
            </ActionButton>
          </div>
        )}

        {phase === 'plated' && latestResult && (
          <div className="cook-plated-box" role="status">
            <div className="cook-stars" aria-label={`${latestResult.stars} de 3 estrellas`}>
              {[1, 2, 3].map((n) => (
                <Star key={n} size={20} className={n <= latestResult.stars ? 'star-filled' : 'star-empty'} />
              ))}
            </div>
            <p>{latestResult.verdict}</p>
            <button type="button" className="game-primary-button cook-action-btn" onClick={nextRecipe}>
              {recipeIndex < recipes.length - 1 ? 'Cocinar siguiente plato' : 'Servir el menú festivo'}
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
