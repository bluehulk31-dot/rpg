import React, { useState, useEffect } from 'react';
import CharacterCreation from './components/CharacterCreation';
import GameInterface from './components/GameInterface';
import { startGame, sendAction } from './services/geminiService';
import { Character, GameState, Message, TurnResponse, GameSettings, VisualEffectType } from './types';

const INITIAL_GAME_STATE: GameState = {
  hp: 100,
  maxHp: 100,
  stats: {
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    level: 1, xp: 0, nextLevelXp: 100
  },
  inventory: [],
  gold: 0,
  location: 'Unknown',
  statusEffects: [],
  isInCombat: false,
  gameOver: false,
};

const DEFAULT_SETTINGS: GameSettings = {
  verbosityLevel: 3, 
  difficulty: 'Normal',
  showDiceRolls: true,
};

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  const [currentVisualEffect, setCurrentVisualEffect] = useState<VisualEffectType | null>(null);

  // Clear visual effect after it plays
  useEffect(() => {
    if (currentVisualEffect && currentVisualEffect !== 'NONE') {
      const timer = setTimeout(() => {
        setCurrentVisualEffect(null);
      }, 1000); // Matches longest animation approx
      return () => clearTimeout(timer);
    }
  }, [currentVisualEffect]);

  const handleStartGame = async (char: Character) => {
    setIsLoading(true);
    try {
      const response = await startGame(char, settings);
      setMessages([
        {
          role: 'model',
          content: response.narrative,
          timestamp: Date.now(),
          skillCheck: response.skillCheck
        },
      ]);
      setGameState(response.gameState);
      setSuggestedActions(response.suggestedActions || []);
      setIsPlaying(true);
      if (response.visualEffect) setCurrentVisualEffect(response.visualEffect);
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to contact the Dungeon Master. Please check your connection or API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (actionText: string) => {
    // Optimistic UI update for user message
    const userMsg: Message = {
      role: 'user',
      content: actionText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    // Clear suggestions while thinking
    setSuggestedActions([]);

    try {
      const response = await sendAction(actionText, settings);
      const aiMsg: Message = {
        role: 'model',
        content: response.narrative,
        timestamp: Date.now(),
        skillCheck: response.skillCheck
      };
      
      setMessages((prev) => [...prev, aiMsg]);
      setGameState(response.gameState);
      setSuggestedActions(response.suggestedActions || []);
      if (response.visualEffect) setCurrentVisualEffect(response.visualEffect);
    } catch (error) {
      console.error("Error sending action:", error);
       setMessages((prev) => [...prev, {
        role: 'model',
        content: "The Dungeon Master is silent... (Network Error, please try again)",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setMessages([]);
    setGameState(INITIAL_GAME_STATE);
    setSuggestedActions([]);
    setCurrentVisualEffect(null);
  };

  return (
    <div className="h-full">
      {!isPlaying ? (
        <CharacterCreation onStart={handleStartGame} isLoading={isLoading} />
      ) : (
        <GameInterface 
          gameState={gameState} 
          messages={messages} 
          isProcessing={isLoading}
          suggestedActions={suggestedActions}
          settings={settings}
          currentVisualEffect={currentVisualEffect}
          onAction={handleAction}
          onRestart={handleRestart}
          onUpdateSettings={setSettings}
        />
      )}
    </div>
  );
};

export default App;
