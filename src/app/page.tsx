"use client";

import { useState, useEffect, useCallback, memo } from 'react';
import { Play, X, DollarSign, RotateCcw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type HorseState = {
  id: number;
  name: string;
  position: number;
  status: 'running' | 'finished' | 'broken';
  color: string;
  hsl: string;
};

type GameState = 'idle' | 'selecting' | 'running' | 'finished';

const HORSES_DATA = [
  { name: 'Thunderbolt', color: 'hsl(220, 80%, 60%)', hsl: '220 80% 60%' },
  { name: 'Stardust', color: 'hsl(25, 80%, 60%)', hsl: '25 80% 60%' },
  { name: 'Gale', color: 'hsl(300, 80%, 60%)', hsl: '300 80% 60%' },
];

const FINISH_LINE = 100;
const MAX_SCORE = 1000;
const TICK_INTERVAL_MS = 100;
const BROKEN_LEG_PROBABILITY = 0.005;

const HorseIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="m3.5 21.5-1.5-11L8 5.5 12 8l6-4 3 6-4 2 2 4-5.5 2.5z" />
      <path d="M12 8V2" />
      <path d="m18 4 1 2" />
      <path d="m4.5 20.5 3-6" />
      <path d="m13.5 13.5 4-4" />
      <path d="m4.5 10.5 3 1.5" />
    </svg>
);
HorseIcon.displayName = 'HorseIcon';

const RaceView = ({ horses }: { horses: HorseState[] }) => {
  return (
    <div className="h-64 w-full bg-cover bg-center rounded-lg relative overflow-hidden border-4 border-primary/30" style={{ backgroundImage: "url('/fondo.png')" }}>
       {horses.map((horse, index) => (
         <div 
            key={horse.id}
            className="absolute transition-all duration-100 ease-linear"
            style={{ 
              left: `calc(${horse.position}% - 60px)`, 
              top: `${25 + index * 20}%`,
              width: '80px',
              height: '80px',
            }}
          >
           <Image 
             src="https://cdn.pixabay.com/animation/2024/12/02/02/56/02-56-03-27_512.gif"
             alt={`Horse ${horse.name}`} 
             width={80} 
             height={80} 
             unoptimized 
             style={{ filter: `hue-rotate(${parseInt(horse.hsl.split(' ')[0])}deg) saturate(1.5) brightness(1.2)`}}
           />
           {horse.status === 'broken' && <X className="h-8 w-8 text-destructive absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />}
         </div>
       ))}
    </div>
  );
};
RaceView.displayName = 'RaceView';


const HorseSelection = memo(({ horse, isSelected, onSelect, disabled }: { horse: HorseState, isSelected: boolean, onSelect: (id: number) => void, disabled: boolean }) => {
    return (
        <button 
          onClick={() => onSelect(horse.id)} 
          disabled={disabled} 
          className={cn(
            "w-full text-left block cursor-pointer disabled:cursor-not-allowed rounded-lg transition-all duration-300 border-2",
            isSelected ? 'border-primary' : 'border-transparent',
            disabled ? '' : 'hover:bg-primary/5'
          )}
          aria-pressed={isSelected}
        >
          <div 
            style={{ '--primary': horse.hsl } as React.CSSProperties}
            className="p-3 rounded-md bg-card/80"
          >
            <div className="flex items-center gap-3">
              <HorseIcon style={{ color: horse.color }} className="h-8 w-8 shrink-0" />
              <span className="font-bold text-lg truncate font-headline">{horse.name}</span>
            </div>
          </div>
        </button>
    );
});
HorseSelection.displayName = 'HorseSelection';

export default function PataPataPanicPage() {
  const [horses, setHorses] = useState<HorseState[]>([]);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState<HorseState | null>(null);
  const [finalMessage, setFinalMessage] = useState('');

  const initializeGame = useCallback(() => {
    setHorses(HORSES_DATA.map((horse, index) => ({
      id: index + 1,
      position: 0,
      status: 'running',
      ...horse,
    })));
    setGameState('selecting');
    setSelectedHorseId(null);
    setScore(0);
    setWinner(null);
    setFinalMessage('');
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'running') return;

    const raceInterval = setInterval(() => {
      setHorses(prevHorses => 
        prevHorses.map(horse => {
          if (horse.status !== 'running') return horse;
          if (Math.random() < BROKEN_LEG_PROBABILITY) return { ...horse, status: 'broken' };
          
          const newPosition = horse.position + Math.random() * 2.0 + 0.4;
          if (newPosition >= FINISH_LINE) {
            return { ...horse, position: FINISH_LINE, status: 'finished' };
          }
          return { ...horse, position: newPosition };
        })
      );
    }, TICK_INTERVAL_MS);

    return () => clearInterval(raceInterval);
  }, [gameState]);

  // Game logic and score updates
  useEffect(() => {
    if (!horses.length) return;
    
    if (gameState === 'running') {
      const playerHorse = horses.find(h => h.id === selectedHorseId);
      if (playerHorse) {
        setScore(Math.floor(playerHorse.position * (MAX_SCORE / FINISH_LINE)));
      }
      
      const winningHorse = horses.find(h => h.status === 'finished');
      if (winningHorse) {
        setGameState('finished');
        setWinner(winningHorse);
        if (winningHorse.id === selectedHorseId) {
          setScore(MAX_SCORE);
          setFinalMessage(`You won! ${winningHorse.name} finished first!`);
        } else {
          setFinalMessage(`Your horse lost! ${winningHorse.name} was the winner.`);
        }
        return;
      }
      
      if (playerHorse?.status === 'broken') {
        setGameState('finished');
        setScore(0);
        setFinalMessage(`Oh no! Your horse, ${playerHorse.name}, broke a leg.`);
        return;
      }

      if (horses.every(h => h.status !== 'running')) {
        setGameState('finished');
        setFinalMessage('Race over! All horses have stopped.');
      }
    }
  }, [horses, gameState, selectedHorseId]);

  const handleCashOut = () => {
    if (gameState === 'running' && selectedHorseId !== null) {
      setGameState('finished');
      setFinalMessage(`You cashed out for ${score} points!`);
    }
  };

  return (
    <main className="min-h-screen text-foreground flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-body bg-cover bg-center" style={{backgroundImage: "url('/fondo.png')"}}>
      <Card className="w-full max-w-4xl shadow-2xl rounded-xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
            Pata Pata Panic
          </h1>
          <p className="text-muted-foreground">Choose your horse and may the odds be ever in your favor!</p>
        </CardHeader>
        <CardContent>
          <RaceView horses={horses} />
          
          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             {horses.map(horse => (
                <HorseSelection 
                  key={horse.id} 
                  horse={horse} 
                  isSelected={selectedHorseId === horse.id} 
                  onSelect={setSelectedHorseId} 
                  disabled={gameState !== 'selecting'}
                />
              ))}
          </div>

          <div className="text-center">
             {gameState === 'finished' && (
                <div className="mb-4 animate-in fade-in duration-500">
                  <p className="text-2xl font-bold font-headline">{finalMessage}</p>
                   {winner && <Award className="h-8 w-8 text-yellow-500 inline-block" />}
                </div>
              )}
             <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="p-4 rounded-lg bg-primary/10 min-w-[150px] text-center">
                    <p className="text-sm text-muted-foreground font-headline">Your Score</p>
                    <p className="text-4xl font-bold text-primary">{score}</p>
                </div>
                {selectedHorseId !== null && gameState !== 'selecting' && (
                    <div className="p-4 rounded-lg bg-background border text-center">
                        <p className="text-sm text-muted-foreground font-headline">Your Pick</p>
                        <p className="text-2xl font-bold" style={{color: horses.find(h => h.id === selectedHorseId)?.color}}>
                            {horses.find(h => h.id === selectedHorseId)?.name}
                        </p>
                    </div>
                )}
             </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center items-center gap-4 pt-6 h-20">
          {gameState === 'selecting' && (
            <Button size="lg" onClick={() => selectedHorseId && setGameState('running')} disabled={!selectedHorseId} className="shadow-lg">
              <Play className="mr-2 h-5 w-5" /> Start Race
            </Button>
          )}
          {gameState === 'running' && (
            <Button size="lg" onClick={handleCashOut} variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80 shadow-lg">
              <DollarSign className="mr-2 h-5 w-5" /> Cash Out
            </Button>
          )}
          {(gameState === 'running' || gameState === 'finished') && (
            <Button size="lg" variant="outline" onClick={initializeGame} className="shadow-lg">
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          )}
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-white text-sm font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
        <p>A Firebase Studio Creation</p>
      </footer>
    </main>
  );
}
