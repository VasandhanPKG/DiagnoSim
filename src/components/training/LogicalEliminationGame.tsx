import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Clock, ChevronRight, CheckCircle2, XCircle, Info, LogOut, RefreshCw, Trash2, Search, ArrowRight, AlertCircle } from "lucide-react";
import eliminationData from "../../data/training/logicalElimination.json";

interface LogicalEliminationGameProps {
  stage: any;
  mode: "drill" | "review";
  reviewData?: any;
  onComplete: (score: number, results: any[]) => void;
  onCancel: () => void;
}

export default function LogicalEliminationGame({ stage, mode, reviewData, onComplete, onCancel }: LogicalEliminationGameProps) {
  const [drills, setDrills] = useState<any[]>([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);

  // Initialize drills for the stage
  useEffect(() => {
    if (mode === "review" && reviewData) {
      setResultsHistory(reviewData.results);
      setDrills(reviewData.results.map((r: any) => r.drill));
      setIsGameOver(true);
    } else {
      const numDrills = stage.passCriteria?.minDrills || 1;
      const shuffled = [...eliminationData.drillLibrary].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, numDrills);
      setDrills(selected);
    }
  }, [stage, mode, reviewData]);

  const drill = drills[currentDrillIndex];

  // Initialize for current drill
  useEffect(() => {
    if (!drill) return;
    if (mode !== "review") {
      setTimeLeft(stage.stage === 3 ? 20 : null);
      setEliminated([]);
      setCurrentClueIndex(0);
      setIsGameOver(false);
    } else {
      const result = resultsHistory[currentDrillIndex];
      setEliminated(result?.eliminated || []);
      setCurrentClueIndex(drill.eliminationClues.length - 1);
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

  const handleEliminate = (diagnosis: string) => {
    if (isGameOver || eliminated.includes(diagnosis) || mode === "review") return;

    const currentClue = drill.eliminationClues[currentClueIndex];
    if (currentClue.diagnosisToEliminate === diagnosis) {
      const newEliminated = [...eliminated, diagnosis];
      setEliminated(newEliminated);
      setFeedback({ type: 'success', message: `Correctly eliminated ${diagnosis}` });
      
      if (currentClueIndex < drill.eliminationClues.length - 1) {
        setTimeout(() => {
          setCurrentClueIndex(currentClueIndex + 1);
          setFeedback(null);
        }, 1000);
      } else {
        handleSubmit(newEliminated);
      }
    } else {
      setFeedback({ type: 'error', message: `Incorrect! ${diagnosis} cannot be ruled out yet.` });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleSubmit = (finalEliminated?: string[]) => {
    const currentEliminated = finalEliminated || eliminated;
    const totalClues = drill.eliminationClues.length;
    const correctEliminations = currentEliminated.length;
    const score = Math.round((correctEliminations / totalClues) * 100);

    const currentResults = {
      score,
      eliminated: [...currentEliminated],
      drill: drill
    };
    setResultsHistory(prev => [...prev, currentResults]);
    setIsGameOver(true);
  };

  const handleNextProblem = () => {
    setCurrentDrillIndex(prev => prev + 1);
    setEliminated([]);
    setCurrentClueIndex(0);
    setIsGameOver(false);
  };

  const handleUnlockNextStage = () => {
    const averageScore = resultsHistory.reduce((acc, r) => acc + r.score, 0) / resultsHistory.length;
    onComplete(averageScore, resultsHistory);
  };

  const handleReattempt = () => {
    setCurrentDrillIndex(0);
    setEliminated([]);
    setCurrentClueIndex(0);
    setIsGameOver(false);
    setResultsHistory([]);
    
    const numDrills = stage.passCriteria?.minDrills || 1;
    const shuffled = [...eliminationData.drillLibrary].sort(() => Math.random() - 0.5);
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
            <div className="text-lg font-black text-rose-600">{currentDrillIndex + 1} / {drills.length}</div>
          </div>
          {timeLeft !== null && mode !== "review" && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-colors ${
              timeLeft < 5 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-black text-lg tabular-nums">{timeLeft}s</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 text-rose-600 font-bold text-sm uppercase tracking-widest mb-6">
              <Shield className="w-5 h-5" />
              Patient Scenario
            </div>
            <p className="text-xl font-black text-slate-900 leading-tight mb-8">
              {drill.scenario}
            </p>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Initial Differential</h4>
              <div className="space-y-2">
                {drill.initialDifferential.map((d: string, i: number) => (
                  <div key={i} className={`text-sm font-bold ${eliminated.includes(d) ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-2xl font-black text-slate-900">Logical Elimination</h3>
              <div className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest">
                Clue {currentClueIndex + 1} of {drill.eliminationClues.length}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isGameOver && mode !== "review" ? (
                <motion.div
                  key={currentClueIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <div className="p-10 bg-rose-50 rounded-[32px] border-2 border-rose-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Search className="w-24 h-24 text-rose-600" />
                    </div>
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4">New Clinical Finding</h4>
                    <p className="text-3xl font-black text-rose-900 leading-tight">
                      "{drill.eliminationClues[currentClueIndex].clue}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drill.initialDifferential.map((d: string) => (
                      <button
                        key={d}
                        disabled={eliminated.includes(d)}
                        onClick={() => handleEliminate(d)}
                        className={`p-6 rounded-3xl text-left font-black text-lg transition-all border-4 flex items-center justify-between group ${
                          eliminated.includes(d)
                            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                            : "bg-white border-slate-100 hover:border-rose-200 text-slate-700 hover:bg-rose-50"
                        }`}
                      >
                        {d}
                        {!eliminated.includes(d) && (
                          <Trash2 className="w-5 h-5 text-slate-300 group-hover:text-rose-500 transition-colors" />
                        )}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`p-4 rounded-2xl font-bold text-center ${
                          feedback.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {feedback.message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="bg-emerald-50 rounded-[40px] p-12 border-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-emerald-900">Elimination Complete</h3>
                          <p className="text-lg font-bold text-emerald-700">Final Diagnosis: <span className="underline">{drill.correctAnswer}</span></p>
                        </div>
                      </div>
                      <div className="text-5xl font-black text-emerald-600">{currentResults?.score}%</div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white/50 rounded-3xl p-8">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Teaching Point</h4>
                        <p className="text-lg text-slate-800 font-medium italic leading-relaxed">
                          "{drill.teachingPoint}"
                        </p>
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
                        className="flex-1 px-12 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
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
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
