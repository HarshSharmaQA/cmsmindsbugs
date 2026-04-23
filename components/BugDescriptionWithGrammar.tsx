"use client";

import { useState } from "react";
import { GrammarChecker } from "./GrammarChecker";

export function BugDescriptionWithGrammar() {
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Bug Description
      </label>
      
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the bug in detail..."
        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
        rows={6}
      />

      <GrammarChecker
        text={description}
        onApplySuggestion={(_, newText) => setDescription(newText)}
      />
    </div>
  );
}
