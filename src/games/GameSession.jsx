import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getNextGridIndex } from './inputUtils.js';

export const GameClockContext = createContext(null);

export function useGameClock() {
  const clock = useContext(GameClockContext);
  if (!clock) throw new Error('El minijuego necesita un reloj de partida.');
  return clock;
}

export function releaseGameInputs() {
  window.dispatchEvent(new Event('festeja:release-input'));
}

// Controles mantenidos: captura de puntero, multitáctil y teclado sin clics
// duplicados ni direcciones atascadas al salir del botón o pausar la partida.
export function HoldButton({ onPress, onRelease, children, ...props }) {
  const heldRef = useRef(false);
  const pointerRef = useRef(null);
  const callbacks = useRef({ onPress, onRelease });
  callbacks.current = { onPress, onRelease };
  const [held, setHeld] = useState(false);

  function press() {
    if (heldRef.current) return;
    heldRef.current = true;
    setHeld(true);
    callbacks.current.onPress?.();
  }

  function release() {
    if (!heldRef.current) return;
    heldRef.current = false;
    pointerRef.current = null;
    setHeld(false);
    callbacks.current.onRelease?.();
  }

  useEffect(() => {
    window.addEventListener('blur', release);
    window.addEventListener('festeja:release-input', release);
    return () => {
      window.removeEventListener('blur', release);
      window.removeEventListener('festeja:release-input', release);
      if (heldRef.current) callbacks.current.onRelease?.();
    };
  }, []);

  return (
    <button
      {...props}
      type="button"
      data-held={held || undefined}
      onPointerDown={(event) => {
        if (event.button !== 0 || pointerRef.current !== null) return;
        event.preventDefault();
        pointerRef.current = event.pointerId;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        press();
      }}
      onPointerUp={(event) => {
        if (pointerRef.current === event.pointerId) release();
      }}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (!['Space', 'Enter'].includes(event.code)) return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) press();
      }}
      onKeyUp={(event) => {
        if (!['Space', 'Enter'].includes(event.code)) return;
        event.preventDefault();
        event.stopPropagation();
        release();
      }}
      onBlur={release}
    >
      {children}
    </button>
  );
}

// Las acciones de precisión se ejecutan al presionar, no al levantar el dedo.
// El clic de accesibilidad sigue funcionando, sin duplicar el clic del puntero.
export function ActionButton({ onAction, children, ...props }) {
  return (
    <button
      {...props}
      type="button"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        onAction();
      }}
      onClick={(event) => {
        if (event.detail === 0) onAction();
      }}
      onKeyDown={(event) => {
        if (!['Space', 'Enter'].includes(event.code)) return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) onAction();
      }}
      onKeyUp={(event) => {
        if (['Space', 'Enter'].includes(event.code)) event.preventDefault();
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </button>
  );
}

export function useGridNavigation(size) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  function onKeyDown(event) {
    const cell = event.target.closest('[data-grid-index]');
    if (!cell) return;
    const next = getNextGridIndex(Number(cell.dataset.gridIndex), event.key, size, event.ctrlKey);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.querySelector(`[data-grid-index="${next}"]`)?.focus();
  }
  function cellProps(index) {
    return {
      'data-grid-index': index,
      tabIndex: focusedIndex === index ? 0 : -1,
      onFocus: () => setFocusedIndex(index),
    };
  }
  return { onKeyDown, cellProps, focusedIndex };
}
