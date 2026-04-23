"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Loader2, Lightbulb, ArrowRight, Sparkles } from "lucide-react";
import { checkGrammar, GrammarSuggestion } from "@/lib/grammar-checker";
import { rephraseText, RephrasingOption } from "@/lib/rephraser";

interface GrammarCheckerProps {
  text: string;
  onApplySuggestion?: (originalText: string, suggestion: string) => void;
  className?: string;
}

export function GrammarChecker({ text, onApplySuggestion, className = "" }: GrammarCheckerProps) {
  const [suggestions, setSuggestions] = useState<GrammarSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState("");
  const [rephrasingOptions, setRephrasingOptions] = useState<RephrasingOption[]>([]);
  const [loadingRephrase, setLoadingRephrase] = useState(false);

  useEffect(() => {
    // Debounce grammar check
    const timer = setTimeout(() => {
      if (text && text !== lastChecked && text.trim().length >= 5) {
        performCheck();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [text, lastChecked]);

  const performCheck = async () => {
    setLoading(true);
    console.log('🔍 Starting grammar check for:', text.substring(0, 50));
    try {
      const results = await checkGrammar(text);
      console.log('✅ Grammar check complete. Found', results.length, 'suggestions');
      setSuggestions(results);
      setLastChecked(text);
    } catch (error) {
      console.error("❌ Grammar check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const performRephrase = async () => {
    setLoadingRephrase(true);
    console.log('✨ Starting rephrasing for:', text.substring(0, 50));
    try {
      const options = await rephraseText(text);
      console.log('✅ Rephrasing complete. Found', options.length, 'variations');
      setRephrasingOptions(options);
    } catch (error) {
      console.error("❌ Rephrasing failed:", error);
    } finally {
      setLoadingRephrase(false);
    }
  };

  const applyRephrase = (newText: string) => {
    if (!onApplySuggestion) return;
    onApplySuggestion(text, newText);
    setRephrasingOptions([]);
  };

  const applySuggestion = (suggestion: GrammarSuggestion, replacement: string) => {
    if (!onApplySuggestion) return;

    const before = text.substring(0, suggestion.offset);
    const after = text.substring(suggestion.offset + suggestion.length);
    const newText = before + replacement + after;

    onApplySuggestion(text, newText);
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  if (!text || text.trim().length < 5) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking grammar...
            </div>
          )}

          {!loading && suggestions.length === 0 && lastChecked === text && (
            <div className="flex items-center gap-2 text-xs text-green-500">
              <CheckCircle2 className="w-3 h-3" />
              No grammar issues found
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-500">
              <AlertCircle className="w-3 h-3" />
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} found
            </div>
          )}
        </div>

        <button
          onClick={performCheck}
          disabled={loading}
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium disabled:opacity-50 ml-2"
        >
          {loading ? 'Checking...' : 'Check Now'}
        </button>

        <button
          onClick={performRephrase}
          disabled={loadingRephrase || text.trim().length < 10}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium disabled:opacity-50 ml-2 flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          {loadingRephrase ? 'Rephrasing...' : 'Rephrase'}
        </button>
      </div>

      {rephrasingOptions.length > 0 && (
        <div className="space-y-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
          <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Rephrasing Suggestions
          </div>
          <div className="space-y-2">
            {rephrasingOptions.map((option, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-slate-800/50 border border-slate-700 hover:border-purple-500/30 transition-colors"
              >
                <p className="text-xs text-slate-300 mb-2">{option.text}</p>
                <button
                  onClick={() => applyRephrase(option.text)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  Use this version
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, idx) => {
            const errorText = text.substring(
              suggestion.offset,
              suggestion.offset + suggestion.length
            );

            return (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <p className="text-slate-300">{suggestion.message}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="line-through text-red-400">{errorText}</span>
                      {suggestion.replacements.length > 0 && (
                        <>
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          <span className="text-green-400">{suggestion.replacements[0]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {suggestion.replacements.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {suggestion.replacements.map((replacement, ridx) => (
                      <button
                        key={ridx}
                        onClick={() => applySuggestion(suggestion, replacement)}
                        className="px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {replacement}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
