import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Character, TurnResponse, GameSettings } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-flash-lite-latest';

// Global chat session instance
let chatSession: Chat | null = null;

const GAME_STATE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "The story description. Follow the length/style instructions provided.",
    },
    gameState: {
      type: Type.OBJECT,
      properties: {
        hp: { type: Type.INTEGER, description: "Current hit points" },
        maxHp: { type: Type.INTEGER, description: "Maximum hit points" },
        stats: {
          type: Type.OBJECT,
          properties: {
            str: { type: Type.INTEGER },
            dex: { type: Type.INTEGER },
            con: { type: Type.INTEGER },
            int: { type: Type.INTEGER },
            wis: { type: Type.INTEGER },
            cha: { type: Type.INTEGER },
            level: { type: Type.INTEGER },
            xp: { type: Type.INTEGER },
            nextLevelXp: { type: Type.INTEGER },
          },
          required: ["str", "dex", "con", "int", "wis", "cha", "level", "xp", "nextLevelXp"]
        },
        inventory: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              rarity: { type: Type.STRING, enum: ["Common", "Uncommon", "Rare", "Epic", "Legendary"] },
              type: { type: Type.STRING, enum: ["Weapon", "Armor", "Potion", "Quest", "Misc"] },
              description: { type: Type.STRING },
              quantity: { type: Type.INTEGER },
            },
            required: ["name", "rarity", "type", "description", "quantity"]
          },
          description: "List of items currently held",
        },
        gold: { type: Type.INTEGER, description: "Current gold amount" },
        location: { type: Type.STRING, description: "Current location name" },
        statusEffects: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Active status effects like 'Poisoned', 'Blessed'",
        },
        isInCombat: { type: Type.BOOLEAN, description: "Whether the player is currently in a fight" },
        gameOver: { type: Type.BOOLEAN, description: "True if the character has died or won" },
      },
      required: ["hp", "maxHp", "stats", "inventory", "gold", "location", "isInCombat", "gameOver"],
    },
    suggestedActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-4 short, context-relevant action options. If in combat, suggest moves like 'Attack', 'Defend', 'Cast Spell'.",
    },
    visualEffect: {
      type: Type.STRING,
      enum: ["NONE", "DAMAGE", "HEAL", "TREASURE", "DANGER", "VICTORY", "DEFEAT"],
      description: "Trigger a visual effect. DAMAGE: player took damage. HEAL: player healed. TREASURE: found loot. DANGER: combat starts or boss appears. VICTORY/DEFEAT: game ends.",
    },
    skillCheck: {
      type: Type.OBJECT,
      description: "OPTIONAL. Only include this if the action SPECIFICALLY required a dice roll for a risky action. Do NOT include for normal narrative flow.",
      properties: {
        skill: { type: Type.STRING, description: "Name of skill used combined with the stat, e.g. 'Athletics (STR)' or 'Persuasion (CHA)'" },
        roll: { type: Type.INTEGER, description: "The final total (baseRoll + modifier)" },
        baseRoll: { type: Type.INTEGER, description: "The natural die roll (1-20)" },
        modifier: { type: Type.INTEGER, description: "The calculated stat modifier ((Score - 10) / 2)" },
        difficultyClass: { type: Type.INTEGER, description: "The target number (DC) to beat" },
        result: { type: Type.STRING, enum: ["SUCCESS", "FAILURE", "CRITICAL_SUCCESS", "CRITICAL_FAILURE"] }
      },
      required: ["skill", "roll", "baseRoll", "modifier", "difficultyClass", "result"]
    }
  },
  required: ["narrative", "gameState", "suggestedActions"],
};

const getStyleInstruction = (level: number) => {
  switch (level) {
    case 1: return "Provide extremely short, telegraphic responses. One sentence maximum. No fluff.";
    case 2: return "Provide concise responses. 2-3 sentences. Focus on action.";
    case 3: return "Provide balanced descriptions. One paragraph. Standard RPG detail.";
    case 4: return "Provide detailed descriptions. Two paragraphs. Focus on atmosphere.";
    case 5: return "Provide very rich, evocative, and lengthy descriptions. 3+ paragraphs. Novel-like quality.";
    default: return "Provide balanced descriptions.";
  }
};

export const startGame = async (character: Character, settings: GameSettings): Promise<TurnResponse> => {
  const styleInstruction = getStyleInstruction(settings.verbosityLevel);

  const systemInstruction = `
    You are an expert Dungeon Master running a text-based RPG with deep mechanics. 
    The setting is a dark fantasy world.
    
    The player character is:
    Name: ${character.name}
    Class: ${character.class}
    Background: ${character.background}

    Game Settings:
    Difficulty: ${settings.difficulty} (Adjust enemy HP, DC checks, and resource scarcity accordingly. Story=Easy, Hardcore=Deadly)
    
    Core Mechanics:
    1. **Stats**: Generate D&D-style stats (STR, DEX, etc.) ranging from 8 to 18 for a level 1 character based on their class.
    2. **Combat**: When enemies appear, set 'isInCombat' to true. Manage initiative invisibly. When 'isInCombat' is true, interpret player actions as combat moves. Calculate damage based on stats.
    3. **Skill Checks**:
       - **WHEN TO ROLL**: Only simulate a D20 roll when the outcome is UNCERTAIN or RISKY (e.g. Attacking, Climbing a wet wall, Lying to a guard, Deciphering runes).
       - **WHEN NOT TO ROLL**: Do NOT generate a skill check for mundane actions (e.g. "Look at the room", "Walk down the hall", "Ask a question", "Pick up an item").
       - **CALCULATION**:
         - The 'modifier' MUST be derived from the character's relevant stat using the formula: floor((Stat - 10) / 2).
         - Example: STR 16 gives a +3 modifier. DEX 10 gives +0. INT 8 gives -1.
         - Select the most appropriate stat for the action (e.g., STR for Athletics, DEX for Stealth, CHA for Persuasion).
         - 'baseRoll' is a random number 1-20.
         - 'roll' must strictly equal baseRoll + modifier.
         - Determine DC based on difficulty: Easy=10, Medium=15, Hard=20 (Adjust for difficulty setting).
       - Fill the 'skillCheck' object with these exact values if a roll occurred.
       - The 'narrative' should reflect the outcome of this check.
    4. **Inventory**: Assign rarities (Common, Uncommon, Rare, Epic, Legendary) to all items.
    5. **Visuals**: Use the 'visualEffect' field to highlight key moments.
    
    Rules:
    - Manage HP strictly.
    - If HP <= 0, gameOver = true, visualEffect = DEFEAT.
    - Always return valid JSON matching the schema.
    
    Style Guide: ${styleInstruction}
  `;

  chatSession = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: GAME_STATE_SCHEMA,
    },
  });

  try {
    const response = await chatSession.sendMessage({
      message: "Begin the adventure. Generate my starting stats and gear.",
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TurnResponse;
  } catch (error) {
    console.error("Failed to start game:", error);
    throw error;
  }
};

export const sendAction = async (action: string, settings: GameSettings): Promise<TurnResponse> => {
  if (!chatSession) {
    throw new Error("Game not started");
  }

  const styleInstruction = getStyleInstruction(settings.verbosityLevel);

  try {
    const response = await chatSession.sendMessage({
      // Inject system note to ensure adherence to settings
      message: `${action} \n[System Note: Narrative Style: ${styleInstruction}. Difficulty: ${settings.difficulty}. Only include a 'skillCheck' if the action has a chance of failure. Otherwise omit it. USE CHARACTER STATS FOR MODIFIERS: floor((Stat-10)/2). Update combat state/stats.]`,
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TurnResponse;
  } catch (error) {
    console.error("Failed to send action:", error);
    throw error;
  }
};
