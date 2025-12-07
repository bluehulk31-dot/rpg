import React, { useState, useEffect, useRef } from 'react';
import { GameState, Message, TurnResponse, VisualEffectType, GameSettings, InventoryItem, Rarity, SkillCheckResult, Difficulty, ItemType } from '../types';
import { Shield, Heart, Coins, MapPin, Send, RotateCcw, Backpack, AlertTriangle, Settings, X, AlignLeft, User, Sword, Dices, Skull, Zap } from 'lucide-react';

interface Props {
  gameState: GameState;
  messages: Message[];
  isProcessing: boolean;
  suggestedActions: string[];
  settings: GameSettings;
  currentVisualEffect: VisualEffectType | null;
  onAction: (action: string) => void;
  onRestart: () => void;
  onUpdateSettings: (settings: GameSettings) => void;
}

const VisualEffectOverlay: React.FC<{ effect: VisualEffectType | null }> = ({ effect }) => {
  if (!effect || effect === 'NONE') return null;

  let overlayClass = "pointer-events-none fixed inset-0 z-50 flex items-center justify-center ";
  let content = null;

  switch (effect) {
    case 'DAMAGE':
      overlayClass += "bg-red-500/0 animate-flash-red";
      break;
    case 'HEAL':
      overlayClass += "bg-green-500/0 animate-flash-green";
      break;
    case 'TREASURE':
      overlayClass += "bg-yellow-400/0 animate-flash-gold";
      break;
    case 'DANGER':
      overlayClass += "animate-pulse-danger";
      break;
    case 'VICTORY':
      content = <div className="text-6xl font-serif text-yellow-400 font-bold animate-bounce drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">VICTORY</div>;
      overlayClass += "bg-black/50";
      break;
    case 'DEFEAT':
      overlayClass += "bg-red-900/30";
      break;
  }

  return (
    <div className={overlayClass}>
      {content}
    </div>
  );
};

const DiceRollCard: React.FC<{ check: SkillCheckResult }> = ({ check }) => {
  const isSuccess = check.result.includes('SUCCESS');
  const isCrit = check.result.includes('CRITICAL');
  
  const borderColor = isSuccess ? (isCrit ? 'border-yellow-500' : 'border-green-500') : (isCrit ? 'border-red-600' : 'border-red-400');
  const bgColor = isSuccess ? 'bg-green-900/20' : 'bg-red-900/20';
  const textColor = isSuccess ? 'text-green-400' : 'text-red-400';

  return (
    <div className={`mt-2 mb-4 p-3 rounded-lg border-l-4 ${borderColor} ${bgColor} animate-fade-in flex items-center justify-between shadow-md max-w-xs`}>
      <div className="flex flex-col">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
          <Dices className="w-3 h-3" /> {check.skill}
        </span>
        <div className="flex items-baseline gap-2">
           <span className={`text-2xl font-serif font-bold ${textColor}`}>
             {check.roll}
           </span>
           <span className="text-xs text-slate-500">
             (d20: {check.baseRoll} {check.modifier >= 0 ? '+' : ''}{check.modifier}) vs DC {check.difficultyClass}
           </span>
        </div>
      </div>
      <div className={`text-xs font-bold px-2 py-1 rounded border ${borderColor} ${textColor}`}>
        {check.result.replace('_', ' ')}
      </div>
    </div>
  );
};

const GameHUD: React.FC<{ 
  gameState: GameState; 
  onOpenSettings: () => void;
  onOpenCharacter: () => void;
}> = ({ gameState, onOpenSettings, onOpenCharacter }) => {
  const hpPercent = Math.min(100, Math.max(0, (gameState.hp / gameState.maxHp) * 100));
  const xpPercent = Math.min(100, Math.max(0, (gameState.stats.xp / gameState.stats.nextLevelXp) * 100));

  return (
    <div className={`border-b p-4 shadow-lg sticky top-0 z-10 flex flex-wrap gap-4 items-center justify-between transition-colors duration-500 ${gameState.isInCombat ? 'bg-red-950/90 border-red-900' : 'bg-slate-900 border-slate-700'}`}>
      
      {/* HP & XP Bar Group */}
      <div className="flex flex-col gap-1 min-w-[160px] flex-1">
        {/* HP */}
        <div className="flex items-center gap-3">
          <div className="relative">
              <Heart className={`w-6 h-6 ${gameState.hp < gameState.maxHp * 0.3 ? 'text-red-500 animate-pulse' : 'text-red-500'}`} fill="currentColor" />
          </div>
          <div className="flex-1 max-w-[200px]">
             <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 ease-out" 
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-300 w-12 text-right">{gameState.hp}/{gameState.maxHp}</span>
        </div>
        
        {/* XP */}
         <div className="flex items-center gap-3">
          <div className="relative w-6 flex justify-center">
              <span className="text-[10px] font-bold text-blue-400">XP</span>
          </div>
          <div className="flex-1 max-w-[200px]">
             <div className="h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out" 
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
           <span className="text-[10px] font-bold text-slate-500 w-12 text-right">Lvl {gameState.stats.level}</span>
        </div>
      </div>

      {/* Combat Indicator */}
      {gameState.isInCombat && (
        <div className="animate-pulse flex items-center gap-2 text-red-400 font-serif font-bold border border-red-500/50 px-3 py-1 rounded bg-red-900/50">
          <Sword className="w-4 h-4" /> COMBAT
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 sm:gap-6 text-sm font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span>{gameState.gold}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <span className="truncate max-w-[100px] sm:max-w-[150px]">{gameState.location}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={onOpenCharacter} 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          title="Character Sheet"
        >
          <User className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenSettings} 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const CharacterModal: React.FC<{ isOpen: boolean; onClose: () => void; stats: GameState['stats'] }> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const statItems = [
    { label: 'STR', value: stats.str, desc: 'Strength' },
    { label: 'DEX', value: stats.dex, desc: 'Dexterity' },
    { label: 'CON', value: stats.con, desc: 'Constitution' },
    { label: 'INT', value: stats.int, desc: 'Intelligence' },
    { label: 'WIS', value: stats.wis, desc: 'Wisdom' },
    { label: 'CHA', value: stats.cha, desc: 'Charisma' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-serif text-white mb-1 text-center">Character Stats</h2>
          <p className="text-center text-slate-400 text-sm mb-6">Level {stats.level} • {stats.xp} / {stats.nextLevelXp} XP</p>
          
          <div className="grid grid-cols-2 gap-4">
            {statItems.map((stat) => (
              <div key={stat.label} className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-rpg-accent">{stat.label}</div>
                  <div className="text-xs text-slate-500">{stat.desc}</div>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
       </div>
    </div>
  );
};

const SettingsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  settings: GameSettings; 
  onUpdate: (s: GameSettings) => void 
}> = ({ isOpen, onClose, settings, onUpdate }) => {
  if (!isOpen) return null;

  const getLabel = (level: number) => {
    switch (level) {
      case 1: return "Telegraphic (1 sentence)";
      case 2: return "Concise (2-3 sentences)";
      case 3: return "Balanced (1 paragraph)";
      case 4: return "Detailed (2 paragraphs)";
      case 5: return "Novelist (3+ paragraphs)";
      default: return "";
    }
  };

  const difficultyOptions: Difficulty[] = ['Story', 'Normal', 'Hardcore'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
        </button>
        <div className="p-6 space-y-8">
          <h2 className="text-xl font-serif text-white flex items-center gap-2">
            <Settings className="w-5 h-5" /> Settings
          </h2>
          
          <div className="space-y-6">
            
            {/* Verbosity Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <h3 className="text-white font-bold flex items-center gap-2">
                   <AlignLeft className="w-4 h-4 text-rpg-accent" />
                   Narrative Detail
                 </h3>
                 <span className="text-xs font-bold text-rpg-accent uppercase tracking-wide">
                   {getLabel(settings.verbosityLevel).split(' ')[0]}
                 </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={settings.verbosityLevel}
                onChange={(e) => onUpdate({...settings, verbosityLevel: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rpg-accent"
              />
              <p className="text-xs text-slate-400 italic bg-slate-800/50 p-2 rounded border border-slate-800">
                "{getLabel(settings.verbosityLevel)}"
              </p>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <h3 className="text-white font-bold flex items-center gap-2">
                   <Skull className="w-4 h-4 text-rpg-accent" />
                   Difficulty
                 </h3>
              </div>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                {difficultyOptions.map(mode => (
                  <button
                    key={mode}
                    onClick={() => onUpdate({ ...settings, difficulty: mode })}
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                      settings.difficulty === mode 
                        ? 'bg-rpg-panel text-rpg-accent shadow-sm border border-slate-600' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 px-1">
                {settings.difficulty === 'Story' && "Focus on narrative. Enemies are weaker."}
                {settings.difficulty === 'Normal' && "Standard RPG challenge."}
                {settings.difficulty === 'Hardcore' && "Brutal enemies. High DCs. Prepare to die."}
              </p>
            </div>

            {/* Show Dice Rolls Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
               <h3 className="text-white font-bold flex items-center gap-2">
                 <Dices className="w-4 h-4 text-rpg-accent" />
                 Show Dice Rolls
               </h3>
               <button
                  onClick={() => onUpdate({ ...settings, showDiceRolls: !settings.showDiceRolls })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.showDiceRolls ? 'bg-rpg-accent' : 'bg-slate-700'}`}
                >
                  <div 
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${settings.showDiceRolls ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryTooltip: React.FC<{ item: InventoryItem; position: { x: number; y: number } | null }> = ({ item, position }) => {
  if (!position) return null;
  
  const getRarityColor = (r: Rarity) => {
    switch (r) {
      case 'Common': return 'text-slate-300 border-slate-600';
      case 'Uncommon': return 'text-green-400 border-green-600';
      case 'Rare': return 'text-blue-400 border-blue-600';
      case 'Epic': return 'text-purple-400 border-purple-600';
      case 'Legendary': return 'text-orange-400 border-orange-500';
      default: return 'text-slate-300 border-slate-600';
    }
  };

  const rarityClass = getRarityColor(item.rarity);
  
  return (
    <div 
      className="fixed z-[100] w-64 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl p-4 pointer-events-none animate-fade-in"
      style={{ 
        top: position.y, 
        left: position.x,
        transform: 'translate(-100%, 0) translate(-16px, -50%)'
      }}
    >
      <div className={`text-sm font-bold border-b pb-1 mb-2 flex justify-between items-center ${rarityClass.split(' ')[1]}`}>
        <span className={rarityClass.split(' ')[0]}>{item.name}</span>
        {item.quantity > 1 && <span className="text-white bg-slate-800 px-2 rounded-full text-xs">x{item.quantity}</span>}
      </div>
      <div className="flex justify-between items-center mb-2">
         <span className={`text-[10px] uppercase font-bold tracking-wider ${rarityClass.split(' ')[0]}`}>{item.rarity}</span>
         <span className="text-[10px] uppercase font-bold text-slate-500">{item.type}</span>
      </div>
      <p className="text-xs text-slate-300 italic leading-relaxed">
        "{item.description}"
      </p>
    </div>
  );
};

const InventoryTile: React.FC<{ 
  item: InventoryItem; 
  onHover: (item: InventoryItem, e: React.MouseEvent) => void;
  onLeave: () => void;
}> = ({ item, onHover, onLeave }) => {
  const getRarityStyle = (r: Rarity) => {
    switch (r) {
      case 'Common': return 'border-slate-600 bg-slate-800/50 text-slate-300';
      case 'Uncommon': return 'border-green-600 bg-green-900/20 text-green-400';
      case 'Rare': return 'border-blue-600 bg-blue-900/20 text-blue-400';
      case 'Epic': return 'border-purple-600 bg-purple-900/20 text-purple-400';
      case 'Legendary': return 'border-orange-500 bg-orange-900/20 text-orange-400';
      default: return 'border-slate-600';
    }
  };

  return (
    <div 
      className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 cursor-help transition-all hover:scale-105 hover:z-10 ${getRarityStyle(item.rarity)}`}
      onMouseEnter={(e) => onHover(item, e)}
      onMouseLeave={onLeave}
    >
      <div className="font-bold text-[10px] uppercase opacity-70 mb-1">{item.type}</div>
      <div className="text-xs font-bold text-center leading-tight line-clamp-2">{item.name}</div>
      {item.quantity > 1 && (
        <div className="absolute bottom-1 right-2 text-xs font-bold bg-black/50 px-1 rounded">{item.quantity}</div>
      )}
    </div>
  );
};

const InventoryPanel: React.FC<{ 
  inventory: InventoryItem[];
  onItemHover: (item: InventoryItem, e: React.MouseEvent) => void;
  onItemLeave: () => void;
}> = ({ inventory, onItemHover, onItemLeave }) => {
  const types: ItemType[] = ['Weapon', 'Armor', 'Potion', 'Quest', 'Misc'];
  const grouped = types.reduce((acc, type) => {
    acc[type] = inventory.filter(i => i.type === type);
    return acc;
  }, {} as Record<ItemType, InventoryItem[]>);

  return (
    <div className="hidden md:flex flex-col w-72 bg-slate-900 border-l border-slate-700 p-4 h-full relative z-20">
      <div className="flex items-center gap-2 mb-4 text-rpg-accent font-serif font-bold border-b border-slate-700 pb-2 shrink-0">
        <Backpack className="w-5 h-5" />
        <h2>Inventory</h2>
      </div>
      
      <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin space-y-6">
        {inventory.length === 0 ? (
          <div className="text-slate-600 text-sm italic text-center mt-10">Your bag is empty.</div>
        ) : (
          types.map(type => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            return (
              <div key={type}>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">{type}s</h3>
                <div className="grid grid-cols-3 gap-2">
                  {items.map((item, idx) => (
                    <InventoryTile 
                      key={`${type}-${idx}`} 
                      item={item} 
                      onHover={onItemHover} 
                      onLeave={onItemLeave} 
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const GameInterfaceComponent: React.FC<Props> = ({ 
  gameState, messages, isProcessing, suggestedActions, settings, currentVisualEffect,
  onAction, onRestart, onUpdateSettings 
}) => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);
  
  // Tooltip State
  const [tooltipItem, setTooltipItem] = useState<InventoryItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Shake container on damage
  const isShake = currentVisualEffect === 'DAMAGE' || currentVisualEffect === 'DANGER';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing, suggestedActions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing && !gameState.gameOver) {
      onAction(input);
      setInput('');
    }
  };

  const handleItemHover = (item: InventoryItem, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipItem(item);
    setTooltipPos({ x: rect.left, y: rect.top + rect.height / 2 });
  };

  const handleItemLeave = () => {
    setTooltipItem(null);
    setTooltipPos(null);
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-950 relative ${isShake ? 'animate-shake' : ''}`}>
      <VisualEffectOverlay effect={currentVisualEffect} />
      
      {/* Global Tooltip Layer */}
      {tooltipItem && tooltipPos && (
        <InventoryTooltip item={tooltipItem} position={tooltipPos} />
      )}

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings} 
        onUpdate={onUpdateSettings} 
      />
      
      <CharacterModal 
        isOpen={showCharacter}
        onClose={() => setShowCharacter(false)}
        stats={gameState.stats}
      />

      <GameHUD 
        gameState={gameState} 
        onOpenSettings={() => setShowSettings(true)} 
        onOpenCharacter={() => setShowCharacter(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full relative">
          
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-4 leading-relaxed shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tr-none' 
                      : 'bg-slate-900/80 text-rpg-text border border-slate-700/50 rounded-tl-none font-serif'
                  }`}
                >
                  {msg.role === 'model' && idx === 0 && (
                    <div className="text-xs font-bold text-rpg-accent mb-2 tracking-widest uppercase">The Adventure Begins</div>
                  )}
                  
                  {/* Skill Check Visualization */}
                  {msg.skillCheck && settings.showDiceRolls && (
                    <DiceRollCard check={msg.skillCheck} />
                  )}

                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                 <div className="bg-slate-900/80 p-4 rounded-lg rounded-tl-none border border-slate-700/50 flex items-center gap-2">
                    <div className="w-2 h-2 bg-rpg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-rpg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-rpg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
            )}
            
            {gameState.gameOver && !isProcessing && (
               <div className="flex justify-center my-8">
                 <div className="bg-red-950/50 border border-red-800 p-6 rounded-xl text-center max-w-md backdrop-blur-sm animate-fade-in">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-serif text-white mb-2">Game Over</h3>
                    <p className="text-red-200 mb-6">{gameState.hp <= 0 ? "You have fallen in battle." : "Your journey has ended."}</p>
                    <button 
                      onClick={onRestart}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-red-800 hover:bg-red-700 text-white rounded font-bold transition"
                    >
                      <RotateCcw className="w-5 h-5" /> Try Again
                    </button>
                 </div>
               </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            {/* Suggested Actions Chips */}
            {!gameState.gameOver && !isProcessing && suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => { onAction(action); }}
                    className={`px-3 py-1.5 border rounded-full transition-colors truncate max-w-[200px] text-xs sm:text-sm ${
                      gameState.isInCombat 
                        ? 'bg-red-900/30 border-red-700 text-red-200 hover:bg-red-800 hover:border-red-500' 
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-rpg-accent'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={gameState.gameOver ? "Game Over" : (gameState.isInCombat ? "Choose your combat action..." : "What do you want to do?")}
                disabled={isProcessing || gameState.gameOver}
                className={`flex-1 bg-black/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    gameState.isInCombat 
                        ? 'border-red-900/50 focus:ring-red-500 focus:border-transparent placeholder-red-800/50' 
                        : 'border-slate-700 focus:ring-rpg-accent focus:border-transparent'
                }`}
              />
              <button
                type="submit"
                disabled={isProcessing || !input.trim() || gameState.gameOver}
                className={`p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white ${
                    gameState.isInCombat ? 'bg-red-700 hover:bg-red-600' : 'bg-rpg-accent hover:bg-amber-600'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Desktop Inventory Sidebar */}
        <InventoryPanel 
          inventory={gameState.inventory} 
          onItemHover={handleItemHover}
          onItemLeave={handleItemLeave}
        />
      </div>
    </div>
  );
};

export default GameInterfaceComponent;
