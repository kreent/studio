"use client";

import { useState, useEffect, useCallback, memo } from 'react';
import { Play, DollarSign, RotateCcw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type RunnerState = {
  id: number;
  name: string;
  position: number;
  status: 'running' | 'finished' | 'broken';
  color: string;
  hsl: string;
};

type GameState = 'idle' | 'selecting' | 'running' | 'finished';

const RUNNERS_DATA = [
  { name: 'Bolt', color: 'hsl(220, 80%, 60%)', hsl: '220 80% 60%' },
  { name: 'Dash', color: 'hsl(25, 80%, 60%)', hsl: '25 80% 60%' },
  { name: 'Sprint', color: 'hsl(300, 80%, 60%)', hsl: '300 80% 60%' },
];

const FINISH_LINE = 100;
const MAX_SCORE = 1000;
const TICK_INTERVAL_MS = 100;
const BROKEN_LEG_PROBABILITY = 0.005;

const SmokePuffIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5.2 17.6c-2.2-2.2-2.2-5.8 0-8 .9-.9 2.1-1.4 3.3-1.4 1.2 0 2.4.5 3.3 1.4" />
      <path d="M8.8 14c-2.2-2.2-2.2-5.8 0-8 .9-.9 2.1-1.4 3.3-1.4 1.2 0 2.4.5 3.3 1.4" />
      <path d="M12.8 17.6c2.2 2.2 5.8 2.2 8 0 .9-.9 1.4-2.1 1.4-3.3 0-1.2-.5-2.4-1.4-3.3" />
      <path d="M16 14c2.2 2.2 5.8 2.2 8 0 .9-.9 1.4-2.1 1.4-3.3 0-1.2-.5-2.4-1.4-3.3" />
    </svg>
);
SmokePuffIcon.displayName = 'SmokePuffIcon';

const RunnerIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={cn("relative", className)} style={style}>
    <Image 
      src="/runner.gif"
      alt="runner"
      layout="fill"
      objectFit="contain"
      unoptimized
    />
  </div>
);
RunnerIcon.displayName = 'RunnerIcon';


const RaceView = ({ runners }: { runners: RunnerState[] }) => {
  return (
    <div className="w-full bg-cover bg-bottom rounded-lg relative overflow-hidden border-4 border-primary/30" style={{ backgroundImage: "url('/race-track-bg.svg')", height: '23rem' }}>
       {runners.map((runner, index) => (
         <div 
            key={runner.id}
            className="absolute transition-all duration-100 ease-linear"
            style={{ 
              left: `calc(${runner.position}% - 40px)`,
              top: `${200 + index * 40}px`,
              width: '80px',
              height: '80px',
            }}
          >
            <div
             className="absolute -top-6 left-1/2 -translate-x-1/2 text-center"
            >
              <span className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap" style={{textShadow: '0 0 5px hsl(var(--primary))'}}>{runner.name}</span>
            </div>
           <RunnerIcon
             className="w-16 h-16"
             style={{ filter: `drop-shadow(0 0 8px ${runner.color})`}}
           />
           {runner.status === 'broken' && <SmokePuffIcon className="h-12 w-12 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />}
         </div>
       ))}
    </div>
  );
};
RaceView.displayName = 'RaceView';


const RunnerSelection = memo(({ runner, isSelected, onSelect, disabled }: { runner: RunnerState, isSelected: boolean, onSelect: (id: number) => void, disabled: boolean }) => {
    return (
        <button 
          onClick={() => onSelect(runner.id)} 
          disabled={disabled} 
          className={cn(
            "w-full text-left block cursor-pointer disabled:cursor-not-allowed rounded-lg transition-all duration-300 border-2",
            isSelected ? 'border-primary' : 'border-primary/20',
            disabled ? '' : 'hover:bg-primary/10 hover:border-primary'
          )}
          aria-pressed={isSelected}
        >
          <div 
            style={{ '--primary': runner.hsl, textShadow: `0 0 10px ${runner.color}` } as React.CSSProperties}
            className="p-3 rounded-md bg-card/80"
          >
            <div className="flex items-center gap-3">
              <RunnerIcon style={{ }} className="h-8 w-8 shrink-0" />
              <span className="font-bold text-lg truncate font-headline">{runner.name}</span>
            </div>
          </div>
        </button>
    );
});
RunnerSelection.displayName = 'RunnerSelection';

export default function RunnerPanicPage() {
  const [runners, setRunners] = useState<RunnerState[]>([]);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [selectedRunnerId, setSelectedRunnerId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState<RunnerState | null>(null);
  const [finalMessage, setFinalMessage] = useState('');

  const initializeGame = useCallback(() => {
    setRunners(RUNNERS_DATA.map((runner, index) => ({
      id: index + 1,
      position: 0,
      status: 'running',
      ...runner,
    })));
    setGameState('selecting');
    setSelectedRunnerId(null);
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
      setRunners(prevRunners => 
        prevRunners.map(runner => {
          if (runner.status !== 'running') return runner;
          if (Math.random() < BROKEN_LEG_PROBABILITY) return { ...runner, status: 'broken' };
          
          const newPosition = runner.position + Math.random() * 2.0 + 0.4;
          if (newPosition >= FINISH_LINE) {
            return { ...runner, position: FINISH_LINE, status: 'finished' };
          }
          return { ...runner, position: newPosition };
        })
      );
    }, TICK_INTERVAL_MS);

    return () => clearInterval(raceInterval);
  }, [gameState]);

  // Game logic and score updates
  useEffect(() => {
    if (!runners.length) return;
    
    if (gameState === 'running') {
      const playerRunner = runners.find(h => h.id === selectedRunnerId);
      if (playerRunner) {
        setScore(Math.floor(playerRunner.position * (MAX_SCORE / FINISH_LINE)));
      }
      
      const winningRunner = runners.find(h => h.status === 'finished');
      if (winningRunner) {
        setGameState('finished');
        setWinner(winningRunner);
        if (winningRunner.id === selectedRunnerId) {
          setScore(MAX_SCORE);
          setFinalMessage(`You won! ${winningRunner.name} finished first!`);
        } else {
          setFinalMessage(`Your runner lost! ${winningRunner.name} was the winner.`);
        }
        return;
      }
      
      if (playerRunner?.status === 'broken') {
        setGameState('finished');
        setScore(0);
        setFinalMessage(`Oh no! Your runner, ${playerRunner.name}, had to stop.`);
        return;
      }

      if (runners.every(h => h.status !== 'running')) {
        setGameState('finished');
        setFinalMessage('Race over! All runners have stopped.');
      }
    }
  }, [runners, gameState, selectedRunnerId]);

  const handleCashOut = () => {
    if (gameState === 'running' && selectedRunnerId !== null) {
      setGameState('finished');
      setFinalMessage(`You cashed out for ${score} points!`);
    }
  };

  return (
    <main className="min-h-screen text-foreground flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-body bg-background">
      <Card className="w-full max-w-4xl shadow-2xl rounded-xl border-2 border-primary/30 bg-card/80 backdrop-blur-sm" style={{boxShadow: '0 0 20px hsl(var(--primary))'}}>
        <CardHeader className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary font-headline" style={{ textShadow: '0 0 10px hsl(var(--primary))' }}>
            Runner Panic
          </h1>
          <p className="text-muted-foreground" style={{ textShadow: '0 0 5px hsl(var(--primary))' }}>Choose your runner and may the odds be ever in your favor!</p>
        </CardHeader>
        <CardContent>
          <RaceView runners={runners} />
          
          <Separator className="my-6 bg-primary/30" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {runners.map(runner => (
                <RunnerSelection 
                  key={runner.id} 
                  runner={runner} 
                  isSelected={selectedRunnerId === runner.id} 
                  onSelect={setSelectedRunnerId} 
                  disabled={gameState !== 'selecting'}
                />
              ))}
          </div>

          <div className="text-center mt-6">
             {gameState === 'finished' && (
                <div className="mb-4 animate-in fade-in duration-500">
                  <p className="text-2xl font-bold font-headline" style={{ textShadow: '0 0 8px hsl(var(--primary))' }}>{finalMessage}</p>
                   {winner && <Award className="h-8 w-8 text-yellow-500 inline-block" style={{filter: 'drop-shadow(0 0 5px yellow)'}} />}
                </div>
              )}
             <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="p-4 rounded-lg bg-primary/10 min-w-[150px] text-center">
                    <p className="text-sm text-muted-foreground font-headline">Your Score</p>
                    <p className="text-4xl font-bold text-primary" style={{ textShadow: '0 0 8px hsl(var(--primary))' }}>{score}</p>
                </div>
                {selectedRunnerId !== null && gameState !== 'selecting' && (
                    <div className="p-4 rounded-lg bg-background border border-primary/30 text-center">
                        <p className="text-sm text-muted-foreground font-headline">Your Pick</p>
                        <p className="text-2xl font-bold" style={{color: runners.find(h => h.id === selectedRunnerId)?.color, textShadow: `0 0 8px ${runners.find(h => h.id === selectedRunnerId)?.color}`}}>
                            {runners.find(h => h.id === selectedRunnerId)?.name}
                        </p>
                    </div>
                )}
             </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center items-center gap-4 pt-6">
          {gameState === 'selecting' && (
            <Button size="lg" onClick={() => selectedRunnerId && setGameState('running')} disabled={!selectedRunnerId} className="shadow-lg" style={{boxShadow: '0 0 15px hsl(var(--primary))'}}>
              <Play className="mr-2 h-5 w-5" /> Start Race
            </Button>
          )}
          {gameState === 'running' && (
            <Button size="lg" onClick={handleCashOut} variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80 shadow-lg" style={{boxShadow: '0 0 15px hsl(var(--accent))'}}>
              <DollarSign className="mr-2 h-5 w-5" /> Cash Out
            </Button>
          )}
          {(gameState === 'running' || gameState === 'finished') && (
            <Button size="lg" variant="outline" onClick={initializeGame} className="shadow-lg border-primary/50" style={{boxShadow: '0 0 15px hsl(var(--primary))'}}>
              <RotateCcw className="mr-2 h-5 w-5" /> Play Again
            </Button>
          )}
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-primary text-sm font-bold" style={{ textShadow: '0 0 5px hsl(var(--primary))' }}>
        <p>A Firebase Studio Creation</p>
      </footer>
    </main>
  );
}
