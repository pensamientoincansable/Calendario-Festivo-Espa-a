import { useEffect, useRef } from 'react';
import Match3Game from './Match3Game.jsx';
import CookingGame from './CookingGame.jsx';
import RaceGame from './RaceGame.jsx';
import SantaGame from './SantaGame.jsx';
import ReyesGame from './ReyesGame.jsx';
import {
  BreakoutGame,
  CandlesGame,
  CatcherGame,
  ChimesGame,
  FireworksGame,
  LightsGame,
  RunnerGame,
  StackerGame,
} from './ArcadeGames.jsx';
import { observeCanvasSize } from './canvasUtils.js';

const GAMES = {
  match3: Match3Game,
  cooking: CookingGame,
  race: RaceGame,
  santa: SantaGame,
  reyes: ReyesGame,
  chimes: ChimesGame,
  runner: RunnerGame,
  stacker: StackerGame,
  fireworks: FireworksGame,
  catcher: CatcherGame,
  breakout: BreakoutGame,
  candles: CandlesGame,
  lights: LightsGame,
};

export default function GameStage({ game, onProgress, onComplete }) {
  const stageRef = useRef(null);
  const Component = GAMES[game.type] ?? Match3Game;
  const height = ['race', 'santa', 'reyes'].includes(game.type)
    ? 310
    : game.type === 'chimes'
      ? 235
      : 300;

  useEffect(() => {
    const cleanups = [...stageRef.current.querySelectorAll('canvas')].map(observeCanvasSize);
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [game.type]);

  return (
    <div
      ref={stageRef}
      className="game-stage"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDownCapture={(event) => {
        if (event.button !== 0) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      style={{ '--canvas-ratio': 500 / height }}
      data-game-type={game.type}
    >
      <Component game={game} onProgress={onProgress} onComplete={onComplete} />
    </div>
  );
}
