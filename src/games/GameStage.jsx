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

export default function GameStage({ game, onProgress, onComplete }) {
  switch (game.type) {
    case 'match3':
      return <Match3Game game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'cooking':
      return <CookingGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'race':
      return <RaceGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'santa':
      return <SantaGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'reyes':
      return <ReyesGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'chimes':
      return <ChimesGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'runner':
      return <RunnerGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'stacker':
      return <StackerGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'fireworks':
      return <FireworksGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'catcher':
      return <CatcherGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'breakout':
      return <BreakoutGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'candles':
      return <CandlesGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    case 'lights':
      return <LightsGame game={game} onProgress={onProgress} onComplete={onComplete} />;
    default:
      return <Match3Game game={game} onProgress={onProgress} onComplete={onComplete} />;
  }
}
