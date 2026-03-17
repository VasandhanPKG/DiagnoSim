import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Clock, ChevronRight, CheckCircle2, XCircle, Info, LogOut, RefreshCw, User, Users, UserPlus, AlertCircle } from "lucide-react";
import probabilityData from "../../data/training/probabilisticThinking.json";

interface ProbabilisticThinkingGameProps {
  stage: any;
  mode: "drill" | "review";
  reviewData?: any;
  onComplete: (score: number, results: any[]) => void;
  onCancel: () => void;
}

export default function ProbabilisticThinkingGame({ stage, mode, reviewData, onComplete, onCancel }: ProbabilisticThinkingGameProps) {
  const [drills, setDrills] = useState<any[]>([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [userProbabilities, setUserProbabilities] = useState<{ [key: string]: number }>({});
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);
  const [currentDrillResults, setCurrentDrillResults] = useState<any[]>([]);

  // Initialize drills for the stage
  useEffect(() => {
    if (mode === "review" && reviewData) {
      setResultsHistory(reviewData.results);
      setDrills(reviewData.results.map((r: any) => r.drill));
      setIsGameOver(true);
    } else {
      const numDrills = stage.passCriteria?.minDrills || 1;
      const shuffled = [...probabilityData.drillLibrary].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, numDrills);
      setDrills(selected);
    }
  }, [stage, mode, reviewData]);

  const drill = drills[currentDrillIndex];

  // Initialize for current drill
  useEffect(() => {
    if (!drill) return;
    if (mode !== "review") {
      setTimeLeft(stage.stage === 3 ? 25 : null);
      setCurrentGroupIndex(0);
      setCurrentDrillResults([]);
      setIsGameOver(false);
      
      const initialProbs: { [key: string]: number } = {};
      drill.diagnoses.forEach((d: string) => initialProbs[d] = 0);
      setUserProbabilities(initialProbs);
    } else {
      const result = resultsHistory[currentDrillIndex];
      setCurrentDrillResults(result?.groupResults || []);
      setCurrentGroupIndex(0);
    }
  }, [drill, stage, mode, currentDrillIndex, resultsHistory]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || isGameOver || mode === "review") return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      handleSubmitDrill();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isGameOver, mode]);

  const handleProbChange = (diagnosis: string, value: number) => {
    if (isGameOver || mode === "review") return;
    setUserProbabilities({ ...userProbabilities, [diagnosis]: value });
  };

  const totalProb = Object.values(userProbabilities).reduce((a, b) => a + b, 0);

  const handleSubmitGroup = () => {
    if (totalProb !== 100 || mode === "review") return;

    const currentGroup = drill.demographics[currentGroupIndex];
    const groupResults = {
      group: currentGroup.text,
      userProbs: { ...userProbabilities },
      correctProbs: currentGroup.correctProbabilities
    };

    const updatedDrillResults = [...currentDrillResults, groupResults];
    setCurrentDrillResults(updatedDrillResults);

    if (currentGroupIndex < drill.demographics.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      const initialProbs: { [key: string]: number } = {};
      drill.diagnoses.forEach((d: string) => initialProbs[d] = 0);
      setUserProbabilities(initialProbs);
    } else {
      handleSubmitDrill(updatedDrillResults);
    }
  };

  const calculateDrillScore = (drillResults: any[]) => {
    if (drillResults.length === 0) return 0;
    let totalError = 0;
    drillResults.forEach(res => {
      Object.keys(res.correctProbs).forEach(diag => {
        totalError += Math.abs((res.userProbs[diag] || 0) - res.correctProbs[diag]);
      });
    });
    const avgError = totalError / (drillResults.length * drill.diagnoses.length);
    return Math.max(0, Math.round(100 - avgError * 2));
  };

  const handleSubmitDrill = (finalDrillResults?: any[]) => {
    const results = finalDrillResults || currentDrillResults;
    const score = calculateDrillScore(results);
    const currentResults = {
      score,
      groupResults: results,
      drill: drill
    };
    setResultsHistory(prev => [...prev, currentResults]);
    setIsGameOver(true);
  };

  const handleNextProblem = () => {
    setCurrentDrillIndex(prev => prev + 1);
    setIsGameOver(false);
  };

  const handleUnlockNextStage = () => {
    const averageScore = resultsHistory.reduce((acc, r) => acc + r.score, 0) / resultsHistory.length;
    onComplete(averageScore, resultsHistory);
  };

  const handleReattempt = () => {
    setCurrentDrillIndex(0);
    setCurrentGroupIndex(0);
    setUserProbabilities({});
    setCurrentDrillResults([]);
    setIsGameOver(false);
    setResultsHistory([]);
    
    const numDrills = stage.passCriteria?.minDrills || 1;
    const shuffled = [...probabilityData.drillLibrary].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numDrills);
    setDrills(selected);
  };

  const currentResults = mode === "review" 
    ? resultsHistory[currentDrillIndex] 
    : isGameOver ? resultsHistory[currentDrillIndex] : null;

  if (!drill) return null;

  const currentGroup = drill.demographics[currentGroupIndex];
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
            <div className="text-lg font-black text-violet-600">{currentDrillIndex + 1} / {drills.length}</div>
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
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 text-violet-600 font-bold text-sm uppercase tracking-widest mb-6">
              <BarChart className="w-5 h-5" />
              Clinical Scenario
            </div>
            <p className="text-2xl font-black text-slate-900 leading-tight mb-8">
              {drill.scenario}
            </p>
            <div className="space-y-3">
              {drill.findings?.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-600">
                  <div className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
            {!isGameOver && mode !== "review" ? (
              <motion.div
                key={currentGroupIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-violet-100 rounded-2xl text-violet-600">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Demographic Group</h4>
                      <h3 className="text-3xl font-black text-slate-900">{currentGroup.text}</h3>
                    </div>
                  </div>
                  <div className={`text-2xl font-black tabular-nums ${totalProb === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {totalProb}% / 100%
                  </div>
                </div>

                <div className="space-y-8">
                  {drill.diagnoses.map((diagnosis: string) => (
                    <div key={diagnosis} className="space-y-4">
                      <div className="flex items-center justify-between font-black text-lg text-slate-700">
                        <span>{diagnosis}</span>
                        <span className="text-violet-600">{userProbabilities[diagnosis]}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={userProbabilities[diagnosis]}
                        onChange={(e) => handleProbChange(diagnosis, parseInt(e.target.value))}
                        className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-violet-600"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-8 border-t border-slate-100">
                  <button
                    onClick={handleSubmitGroup}
                    disabled={totalProb !== 100}
                    className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center gap-3"
                  >
                    {currentGroupIndex < drill.demographics.length - 1 ? "Next Group" : "Finalize Probabilities"}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="bg-violet-50 rounded-[40px] p-12 border-4 border-violet-500">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-violet-100">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-violet-900">Probabilistic Thinking</h3>
                        <p className="text-lg font-bold text-violet-700">Calibration Accuracy</p>
                      </div>
                    </div>
                    <div className="text-5xl font-black text-violet-600">{currentResults?.score}%</div>
                  </div>

                  <div className="space-y-8">
                    {currentResults?.groupResults.map((res: any, i: number) => (
                      <div key={i} className="bg-white/50 rounded-3xl p-6 border border-violet-100">
                        <h4 className="text-sm font-black text-violet-900 mb-4">{res.group}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.keys(res.correctProbs).map(diag => (
                            <div key={diag} className="text-xs font-bold">
                              <div className="text-slate-400 mb-1">{diag}</div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-900">You: {res.userProbs[diag]}%</span>
                                <span className="text-violet-600">Expert: {res.correctProbs[diag]}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
                        className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setCurrentDrillIndex(prev => Math.min(drills.length - 1, prev + 1))}
                        disabled={currentDrillIndex === drills.length - 1}
                        className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        Next
                      </button>
                    </div>
                  ) : !isLastProblem ? (
                    <button 
                      onClick={handleNextProblem}
                      className="flex-1 px-12 py-4 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-100 flex items-center justify-center gap-2"
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
