import React, { useState } from 'react';
import { Character, CharacterClass } from '../types';
import { Sword, Wand, Scroll, HeartPulse, Sparkles } from 'lucide-react';

interface Props {
  onStart: (character: Character) => void;
  isLoading: boolean;
}

const CharacterCreation: React.FC<Props> = ({ onStart, isLoading }) => {
  const [name, setName] = useState('');
  const [charClass, setCharClass] = useState<CharacterClass>(CharacterClass.WARRIOR);
  const [background, setBackground] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && background) {
      onStart({ name, class: charClass, background });
    }
  };

  const getClassIcon = (c: CharacterClass) => {
    switch (c) {
      case CharacterClass.WARRIOR: return <Sword className="w-5 h-5" />;
      case CharacterClass.MAGE: return <Wand className="w-5 h-5" />;
      case CharacterClass.ROGUE: return <Sparkles className="w-5 h-5" />;
      case CharacterClass.CLERIC: return <HeartPulse className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-slate-900 to-black">
      <div className="w-full max-w-2xl bg-rpg-panel border border-slate-700 rounded-xl shadow-2xl overflow-hidden p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-rpg-accent mb-2">Create Your Hero</h1>
          <p className="text-slate-400">Your destiny awaits in the realms of Gemini.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Character Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-rpg-accent focus:border-transparent transition"
              placeholder="e.g. Valerius the Bold"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Class</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(CharacterClass).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCharClass(c)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                    charClass === c
                      ? 'bg-amber-900/40 border-rpg-accent text-rpg-accent'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {getClassIcon(c)}
                  <span className="mt-2 text-sm font-bold">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Background Story</label>
            <textarea
              required
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white h-24 focus:ring-2 focus:ring-rpg-accent focus:border-transparent transition"
              placeholder="Who are you? Why are you adventuring?"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-lg font-serif font-bold text-xl transition-all shadow-lg ${
              isLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white transform hover:scale-[1.02]'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Scroll className="animate-spin h-5 w-5" /> Summoning World...
              </span>
            ) : (
              "Begin Adventure"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreation;
