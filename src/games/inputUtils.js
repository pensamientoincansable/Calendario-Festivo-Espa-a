export function getNextGridIndex(index, key, size, wholeBoard = false) {
  const row = Math.floor(index / size);
  const col = index % size;
  switch (key) {
    case 'ArrowLeft':
      return row * size + Math.max(0, col - 1);
    case 'ArrowRight':
      return row * size + Math.min(size - 1, col + 1);
    case 'ArrowUp':
      return Math.max(0, row - 1) * size + col;
    case 'ArrowDown':
      return Math.min(size - 1, row + 1) * size + col;
    case 'Home':
      return wholeBoard ? 0 : row * size;
    case 'End':
      return wholeBoard ? size * size - 1 : (row + 1) * size - 1;
    default:
      return null;
  }
}

export function capturePointer(event) {
  if (event.button === 0) event.currentTarget.setPointerCapture?.(event.pointerId);
}
