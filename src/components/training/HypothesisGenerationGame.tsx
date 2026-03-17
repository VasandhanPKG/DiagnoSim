import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ListFilter, Clock, ChevronRight, CheckCircle2, XCircle, Info, LogOut, RefreshCw, Plus, Trash2, GripVertical, AlertCircle } from "lucide-react";
import hypothesisData from "../../data/training/hypothesisGeneration.json";

interface HypothesisGenerationGameProps {
  stage: any;
  mode: "drill" | "review";
  reviewData?: any;
  onComplete: (score: number, results: any[]) => void;
  onCancel: () => void;
}

const COMMON_DIAGNOSES = [
  "Myocardial Infarction", "Aortic Dissection", "Pulmonary Embolism", "Pneumothorax", "GERD",
  "Ischemic Stroke", "Hemorrhagic Stroke", "Hypoglycemia", "Todd's Paralysis", "Complex Migraine",
  "Appendicitis", "Ectopic Pregnancy", "Ovarian Torsion", "Pelvic Inflammatory Disease", "Mesenteric Lymphadenitis",
  "Pneumonia", "Sepsis", "Heart Failure", "Bronchitis", "Meningitis", "Subarachnoid Hemorrhage", "Encephalitis",
  "Deep Vein Thrombosis", "Cellulitis", "Baker's Cyst", "Diabetic Ketoacidosis", "Anaphylaxis", "Asthma Exacerbation",
  "UTI", "Pyelonephritis", "Urethritis", "Vaginitis", "Nephrolithiasis", "Diverticulitis", "Pancreatitis"
];

export default function HypothesisGenerationGame({ stage, mode, reviewData, onComplete, onCancel }: HypothesisGenerationGameProps) {
  const [drills, setDrills] = useState<any[]>([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [differential, setDifferential] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);

  // Initialize drills for the stage
  useEffect(() => {
    if (mode === "review" && reviewData) {
      setResultsHistory(reviewData.results);
      setDrills(reviewData.results.map((r: any) => r.drill));
      setIsGameOver(true);
    } else {
      const numDrills = stage.passCriteria?.minDrills || 1;
      const shuffled = [...hypothesisData.drillLibrary].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, numDrills);
      setDrills(selected);
    }
  }, [stage, mode, reviewData]);

  const drill = drills[currentDrillIndex];

  // Initialize for current drill
  useEffect(() => {
    if (!drill) return;
    if (mode !== "review") {
      setTimeLeft(stage.stage === 3 ? 30 : null);
      setDifferential([]);
      setIsGameOver(false);
    } else {
      const result = resultsHistory[currentDrillIndex];
      setDifferential(result?.differential || []);
    }
  }, [drill, stage, mode, currentDrillIndex, resultsHistory]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || isGameOver || mode === "review") return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isGameOver, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 1 && stage.stage <= 2) {
      setSuggestions(COMMON_DIAGNOSES.filter(d => d.toLowerCase().includes(value.toLowerCase()) && !differential.includes(d)));
    } else {
      setSuggestions([]);
    }
  };

  const addDiagnosis = (diagnosis: string) => {
    if (differential.length >= 5 || isGameOver || mode === "review") return;
    setDifferential([...differential, diagnosis]);
    setInputValue("");
    setSuggestions([]);
  };

  const removeDiagnosis = (index: number) => {
    if (isGameOver || mode === "review") return;
    setDifferential(differential.filter((_, i) => i !== index));
  };

  const moveDiagnosis = (index: number, direction: 'up' | 'down') => {
    if (isGameOver || mode === "review") return;
    const newDiff = [...differential];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= differential.length) return;
    [newDiff[index], newDiff[targetIndex]] = [newDiff[targetIndex], newDiff[index]];
    setDifferential(newDiff);
  };

  const calculateScore = (currentDrill: any, currentDifferential: string[]) => {
    if (!currentDrill) return 0;
    let score = 0;
    const correct = currentDrill.correctRanking[0];
    const mustNotMiss = currentDrill.correctRanking.slice(0, 3);

    if (currentDifferential[0] === correct) score += 50;
    else if (currentDifferential.includes(correct)) score += 25;

    const foundMustNotMiss = mustNotMiss.filter(d => currentDifferential.includes(d)).length;
    score += (foundMustNotMiss / mustNotMiss.length) * 50;

    return Math.round(score);
  };

  const handleSubmit = () => {
    const score = calculateScore(drill, differential);
    const currentResults = {
      score,
      differential: [...differential],
      drill: drill
    };
    setResultsHistory(prev => [...prev, currentResults]);
    setIsGameOver(true);
  };

  const handleNextProblem = () => {
    setCurrentDrillIndex(prev => prev + 1);
    setDifferential([]);
    setInputValue("");
    setIsGameOver(false);
  };

  const handleUnlockNextStage = () => {
    const averageScore = resultsHistory.reduce((acc, r) => acc + r.score, 0) / resultsHistory.length;
    onComplete(averageScore, resultsHistory);
  };

  const handleReattempt = () => {
    setCurrentDrillIndex(0);
    setDifferential([]);
    setInputValue("");
    setIsGameOver(false);
    setResultsHistory([]);
    
    const numDrills = stage.passCriteria?.minDrills || 1;
    const shuffled = [...hypothesisData.drillLibrary].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numDrills);
    setDrills(selected);
  };

  const currentResults = mode === "review" 
    ? resultsHistory[currentDrillIndex] 
    : isGameOver ? resultsHistory[currentDrillIndex] : null;

  if (!drill) return null;

  const isLastProblem = currentDrillIndex === drills.length - 1;
  const averageScoreSoFar = resultsHistory.length > 0 
    ? resultsHistory.reduce((acc, r) => acc + r.score, 0) / resultsHistory.length 
    : 0;
  const isPassed = averageScoreSoFar >= 80;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
            <LogOut className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-100" />
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">
              {mode === "review" ? "Review Mode" : `Stage ${stage.stage}`}
            </div>
            <div className="text-lg font-black text-slate-900">{stage.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem</div>
            <div className="text-lg font-black text-amber-600">{currentDrillIndex + 1} / {drills.length}</div>
          </div>
          {timeLeft !== null && mode !== "review" && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-colors ${
              timeLeft < 10 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-black text-lg tabular-nums">{timeLeft}s</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 text-amber-600 font-bold text-sm uppercase tracking-widest mb-6">
              <ListFilter className="w-5 h-5" />
              Patient Presentation
            </div>
            <p className="text-2xl font-black text-slate-900 leading-tight mb-8">
              {drill.scenario}
            </p>
            <div className="space-y-3">
              {drill.findings.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-600">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Generate Differential</h3>
            
            {!isGameOver && mode !== "review" && (
              <div className="relative mb-12">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && inputValue && addDiagnosis(inputValue)}
                    placeholder="Type a diagnosis..."
                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-amber-500 focus:bg-white transition-all outline-none"
                  />
                  <button
                    onClick={() => inputValue && addDiagnosis(inputValue)}
                    className="p-4 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-10 overflow-hidden"
                    >
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => addDiagnosis(s)}
                          className="w-full text-left px-6 py-3 hover:bg-slate-50 font-bold text-slate-700 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-4 mb-12">
              {differential.map((d, i) => (
                <motion.div
                  key={d}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 ${
                    isGameOver || mode === "review"
                      ? drill.correctRanking.includes(d) ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-rose-50 border-rose-500 text-rose-900'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400">
                    {i + 1}
                  </div>
                  <span className="flex-1 font-black text-lg">{d}</span>
                  {!isGameOver && mode !== "review" && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => moveDiagnosis(i, 'up')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><GripVertical className="w-4 h-4" /></button>
                      <button onClick={() => removeDiagnosis(i)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </motion.div>
              ))}
              {differential.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px] text-slate-400 font-bold">
                  No hypotheses added yet.
                </div>
              )}
            </div>

            {!isGameOver && mode !== "review" ? (
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={differential.length < 3}
                  className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center gap-3"
                >
                  Finalize Differential
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-amber-50 rounded-3xl p-8 border-2 border-amber-200">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-amber-900">Expert Evaluation</h3>
                    <div className="text-4xl font-black text-amber-600">{currentResults?.score}%</div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4">Correct Ranking</h4>
                      <div className="space-y-2">
                        {drill.correctRanking.map((d: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm font-bold text-amber-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {i + 1}. {d}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-6 border-t border-amber-200">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">Teaching Point</h4>
                      <p className="text-amber-800 font-medium italic">"{drill.teachingPoint}"</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {mode === "review" ? (
                    <div className="flex gap-4 w-full">
                      <button 
                        onClick={() => setCurrentDrillIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentDrillIndex === 0}
                        className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setCurrentDrillIndex(prev => Math.min(drills.length - 1, prev + 1))}
                        disabled={currentDrillIndex === drills.length - 1}
                        className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  ) : !isLastProblem ? (
                    <button 
                      onClick={handleNextProblem}
                      className="flex-1 px-12 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
                    >
                      Next Problem
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex flex-col items-end gap-2 w-full">
                      {!isPassed && (
                        <p className="text-rose-600 text-sm font-bold mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Average score {Math.round(averageScoreSoFar)}% is below 80% pass mark.
                        </p>
                      )}
                      <div className="flex gap-4 w-full">
                        {!isPassed && (
                          <button 
                            onClick={handleReattempt}
                            className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Re-attempt
                          </button>
                        )}
                        <button 
                          onClick={handleUnlockNextStage}
                          className={`flex-1 px-12 py-4 rounded-2xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 ${
                            isPassed 
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100" 
                              : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                          }`}
                        >
                          {isPassed ? "Unlock Next Stage" : "Finish Drill"}
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
