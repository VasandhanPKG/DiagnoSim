import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Zap, Clock, ChevronRight, CheckCircle2, XCircle, Info, AlertCircle, LogOut, Search, RefreshCw } from "lucide-react";
import signalData from "../../data/signalDetectionData.json";

interface Finding {
  id: string;
  text: string;
  type: "signal" | "distractor" | "noise";
  explanation?: string;
}

interface Drill {
  id: string;
  disease: string;
  scenario: string;
  findings: Finding[];
  rubric: {
    minSignals: number;
    commonMistakes: string[];
    precisionFormula: string;
    recallFormula: string;
  };
}

interface Stage {
  id: number;
  name: string;
  description: string;
  hintsVisible: boolean;
  timeLimit: number | null;
  noiseLevel: string;
  passCriteria: { minScore: number; minDrills: number };
}

interface SignalDetectionGameProps {
  stage: Stage;
  mode: "drill" | "review";
  reviewData?: any;
  onComplete: (score: number, results: any[]) => void;
  onCancel: () => void;
}

export default function SignalDetectionGame({ stage, mode, reviewData, onComplete, onCancel }: SignalDetectionGameProps) {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(stage.timeLimit);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [confidence, setConfidence] = useState<number>(50);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);

  // Initialize drills for the stage
  useEffect(() => {
    if (mode === "review" && reviewData) {
      setResultsHistory(reviewData.results);
      setDrills(reviewData.results.map((r: any) => r.drill));
      setIsGameOver(true);
      setShowExplanations(true);
    } else {
      const numDrills = stage.passCriteria.minDrills;
      const shuffled = [...signalData.drills].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, numDrills).map(d => ({
        ...d,
        findings: [...d.findings].sort(() => Math.random() - 0.5)
      })) as Drill[];
      setDrills(selected);
    }
  }, [stage, mode, reviewData]);

  const drill = drills[currentDrillIndex];

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || isGameOver || mode === "review") return;
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isGameOver, mode]);

  const toggleFinding = (id: string) => {
    if (isGameOver || mode === "review") return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateDrillResults = (currentDrill: Drill, currentSelectedIds: string[]) => {
    const signals = currentDrill.findings.filter(f => f.type === "signal").map(f => f.id);
    const distractors = currentDrill.findings.filter(f => f.type === "distractor").map(f => f.id);
    const noise = currentDrill.findings.filter(f => f.type === "noise").map(f => f.id);

    const tp = currentSelectedIds.filter(id => signals.includes(id)).length;
    const fp = currentSelectedIds.filter(id => distractors.includes(id) || noise.includes(id)).length;
    const fn = signals.length - tp;

    const precision = tp + fp === 0 ? 0 : (tp / (tp + fp)) * 100;
    const recall = (tp / signals.length) * 100;
    const score = (precision * 0.6) + (recall * 0.4);

    return { precision, recall, score, tp, fp, fn, selectedIds: currentSelectedIds, drill: currentDrill };
  };

  const handleSubmit = () => {
    const currentResults = calculateDrillResults(drill, selectedIds);
    setResultsHistory(prev => [...prev, currentResults]);
    setIsGameOver(true);
  };

  const handleNextProblem = () => {
    setCurrentDrillIndex(prev => prev + 1);
    setSelectedIds([]);
    setTimeLeft(stage.timeLimit);
    setIsGameOver(false);
    setShowExplanations(false);
  };

  const handleUnlockNextStage = () => {
    const averageScore = resultsHistory.reduce((acc, r) => acc + r.score, 0) / resultsHistory.length;
    onComplete(averageScore, resultsHistory);
  };

  const handleReattempt = () => {
    setCurrentDrillIndex(0);
    setSelectedIds([]);
    setTimeLeft(stage.timeLimit);
    setIsGameOver(false);
    setShowExplanations(false);
    setResultsHistory([]);
    
    const numDrills = stage.passCriteria.minDrills;
    const shuffled = [...signalData.drills].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numDrills).map(d => ({
      ...d,
      findings: [...d.findings].sort(() => Math.random() - 0.5)
    })) as Drill[];
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
      {/* Game Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-100" />
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">
              {mode === "review" ? "Review Mode" : `Stage ${stage.id}`}
            </div>
            <div className="text-lg font-black text-slate-900">{stage.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem</div>
              <div className="text-lg font-black text-indigo-600">{currentDrillIndex + 1} / {drills.length}</div>
            </div>
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

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Scenario Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-6">
              <Search className="w-4 h-4" />
              Clinical Scenario
            </div>
            <p className="text-xl text-slate-800 leading-relaxed font-medium mb-8 italic">
              "{drill.scenario}"
            </p>
            
            {mode === "review" && (
              <div className="mb-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Diagnosis</h4>
                <p className="text-lg font-black text-emerald-900">{drill.disease}</p>
              </div>
            )}

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Task Instructions</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                  Identify all <span className="font-bold text-slate-900">Critical Signals</span> that point to the diagnosis.
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shrink-0" />
                  Ignore <span className="font-bold text-slate-900">Noise</span> and avoid <span className="font-bold text-slate-900">Active Distractors</span>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Findings Grid */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drill.findings.map((finding, index) => {
              const isSelected = mode === "review" 
                ? currentResults?.selectedIds.includes(finding.id)
                : selectedIds.includes(finding.id);
              const isCorrect = finding.type === "signal";
              
              return (
                <motion.button
                  key={finding.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleFinding(finding.id)}
                  disabled={isGameOver || mode === "review"}
                  className={`p-6 rounded-2xl text-left transition-all border-2 relative group ${
                    isGameOver || mode === "review"
                      ? isCorrect
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                        : isSelected
                          ? "bg-rose-50 border-rose-500 text-rose-900"
                          : "bg-white border-slate-100 opacity-50"
                      : isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "bg-white border-slate-100 hover:border-indigo-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-bold leading-snug">{finding.text}</span>
                    {(isGameOver || mode === "review") && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {(isGameOver || mode === "review") && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  </div>

                  {(isGameOver || mode === "review") && showExplanations && finding.explanation && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-current/10 text-xs leading-relaxed opacity-80 italic"
                    >
                      {finding.explanation}
                    </motion.div>
                  )}

                  {stage.hintsVisible && !isGameOver && mode !== "review" && isCorrect && (
                    <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 p-1 rounded-full shadow-sm">
                      <Zap className="w-3 h-3" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {!isGameOver && mode !== "review" ? (
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={selectedIds.length === 0}
                className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center gap-3"
              >
                Submit Analysis
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-10 border-4 border-indigo-600 shadow-2xl"
            >
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="w-40 h-40 rounded-full border-8 border-indigo-600 flex flex-col items-center justify-center text-center bg-indigo-50">
                  <div className="text-4xl font-black text-indigo-600">{Math.round(currentResults?.score || 0)}%</div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Accuracy</div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <ResultStat label="Signals Found" value={`${currentResults?.tp || 0} / ${drill.findings.filter(f => f.type === "signal").length}`} />
                  <ResultStat label="Noise Selected" value={(currentResults?.fp || 0).toString()} />
                  <ResultStat label="Precision" value={`${Math.round(currentResults?.precision || 0)}%`} />
                  <ResultStat label="Recall" value={`${Math.round(currentResults?.recall || 0)}%`} />
                </div>
              </div>

              <div className="mt-12 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowExplanations(!showExplanations)}
                    className="flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                  >
                    <Info className="w-4 h-4" />
                    {showExplanations ? "Hide" : "Show"} Clinical Explanations
                  </button>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {mode === "review" ? (
                    <div className="flex gap-4 w-full">
                      <button 
                        onClick={() => setCurrentDrillIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentDrillIndex === 0}
                        className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setCurrentDrillIndex(prev => Math.min(drills.length - 1, prev + 1))}
                        disabled={currentDrillIndex === drills.length - 1}
                        className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  ) : !isLastProblem ? (
                    <button 
                      onClick={handleNextProblem}
                      className="w-full md:w-auto px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      Next Problem
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      {!isPassed && (
                        <p className="text-rose-600 text-sm font-bold mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Average score {Math.round(averageScoreSoFar)}% is below 80% pass mark.
                        </p>
                      )}
                      <div className="flex gap-4">
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
                          className={`w-full md:w-auto px-12 py-4 rounded-2xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 ${
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
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

function ResultStat({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}
