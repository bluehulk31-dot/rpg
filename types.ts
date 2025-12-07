export enum CharacterClass {
  WARRIOR = 'Warrior',
  MAGE = 'Mage',
  ROGUE = 'Rogue',
  CLERIC = 'Cleric'
}

export interface Character {
  name: string;
  class: CharacterClass;
  background: string;
}

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
export type ItemType = 'Weapon' | 'Armor' | 'Potion' | 'Quest' | 'Misc';

export interface InventoryItem {
  name: string;
  rarity: Rarity;
  type: ItemType;
  description: string;
  quantity: number;
}

export interface CharacterStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}

export interface GameState {
  hp: number;
  maxHp: number;
  stats: CharacterStats;
  inventory: InventoryItem[];
  gold: number;
  location: string;
  statusEffects: string[];
  isInCombat: boolean;
  gameOver: boolean;
}

export type VisualEffectType = 'NONE' | 'DAMAGE' | 'HEAL' | 'TREASURE' | 'DANGER' | 'VICTORY' | 'DEFEAT';

export interface SkillCheckResult {
  skill: string; // e.g., "Strength (Athletics)"
  roll: number; // The final total
  baseRoll: number; // The natural d20 roll
  modifier: number; // The stat modifier added
  difficultyClass: number; // The target number
  result: 'SUCCESS' | 'FAILURE' | 'CRITICAL_SUCCESS' | 'CRITICAL_FAILURE';
}

export interface TurnResponse {
  narrative: string;
  gameState: GameState;
  suggestedActions: string[];
  visualEffect?: VisualEffectType;
  skillCheck?: SkillCheckResult;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  skillCheck?: SkillCheckResult;
}

export type Difficulty = 'Story' | 'Normal' | 'Hardcore';

export interface GameSettings {
  verbosityLevel: number; // 1 to 5
  difficulty: Difficulty;
  showDiceRolls: boolean;
}
