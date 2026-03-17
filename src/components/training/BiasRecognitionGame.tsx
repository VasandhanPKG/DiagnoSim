import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Clock, ChevronRight, CheckCircle2, XCircle, Info, LogOut, RefreshCw, Zap, AlertCircle } from "lucide-react";
import biasData from "../../data/training/biasRecognition.json";

interface BiasRecognitionGameProps {
  stage: any;
  mode: "drill" | "review";
  reviewData?: any;
  onComplete: (score: number, results: any[]) => void;
  onCancel: () => void;
}

const ALL_BIASES = [
  "Anchoring Bias", "Availability Bias", "Confirmation Bias", "Premature Closure",
  "Framing Effect", "Representativeness Bias", "Sunk Cost Fallacy", "Blind Spot Bias",
  "Affective Bias", "Overconfidence Bias", "Hindsight Bias", "Outcome Bias"
];

export default function BiasRecognitionGame({ stage, mode, reviewData, onComplete, onCancel }: BiasRecognitionGameProps) {
  const [drills, setDrills] = useState<any[]>([]);
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [selectedBias, setSelectedBias] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);

  // Initialize drills for the stage
  useEffect(() => {
    if (mode === "review" && reviewData) {
      setResultsHistory(reviewData.results);
      setDrills(reviewData.results.map((r: any) => r.drill));
      setIsGameOver(true);
    } else {
      const numDrills = stage.passCriteria?.minDrills || 1;
      const shuffled = [...biasData.drillLibrary].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, numDrills);
      setDrills(selected);
    }
  }, [stage, mode, reviewData]);

  const drill = drills[currentDrillIndex];

  // Initialize for current drill
  useEffect(() => {
    if (!drill) return;
    if (mode !== "review") {
      setTimeLeft(stage.stage === 3 ? 15 : null);
      setSelectedBias(null);
      setIsGameOver(false);

      const otherBiases = ALL_BIASES
        .filter(b => b !== drill.correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, stage.stage >= 2 ? 5 : 3);
      setOptions([...otherBiases, drill.correctAnswer].sort(() => Math.random() - 0.5));
    } else {
      const result = resultsHistory[currentDrillIndex];
      setSelectedBias(result?.selectedBias || null);
      setOptions(result?.options || [drill.correctAnswer]);
    }
  }, [drill, stage, mode, currentDrillIndex, resultsHistory]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || isGameOver || mode === "review") return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isGameOver, mode]);

  const handleSubmit = () => {
    const isCorrect = selectedBias === drill?.correctAnswer;
    const currentResults = {
      isCorrect,
      score: isCorrect ? 100 : 0,
      selectedBias,
      options: [...options],
      drill: drill
    };
    setResultsHistory(prev => [...prev, currentResults]);
    setIsGameOver(true);
  };

  const handleNextProblem = () => {
    setCurrentDrillIndex(prev => prev + 1);
    setSelectedBias(null);
    setIsGameOver(false);
  };

  const handleUnlockNextStage = () => {
    const averageScore = resultsHistory.reduce((acc, r) => acc + r.score, 0) / resultsHistory.length;
    onComplete(averageScore, resultsHistory);
  };

  const handleReattempt = () => {
    setCurrentDrillIndex(0);
    setSelectedBias(null);
    setIsGameOver(false);
    setResultsHistory([]);
    
    const numDrills = stage.passCriteria?.minDrills || 1;
    const shuffled = [...biasData.drillLibrary].sort(() => Math.random() - 0.5);
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
            <div className="text-lg font-black text-orange-600">{currentDrillIndex + 1} / {drills.length}</div>
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

      <main className="flex-1 max-w-4xl mx-auto w-full p-8 space-y-8">
        <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-orange-600 font-bold text-sm uppercase tracking-widest mb-8">
            <AlertTriangle className="w-5 h-5" />
            Cognitive Pitfall
          </div>
          
          <p className="text-3xl font-black text-slate-900 leading-tight mb-12">
            {drill.scenario}
          </p>

          {!isGameOver && mode !== "review" ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedBias(option)}
                    className={`p-6 rounded-3xl text-left font-black text-lg transition-all border-4 ${
                      selectedBias === option
                        ? "bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-100"
                        : "bg-white border-slate-100 hover:border-orange-200 text-slate-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedBias}
                  className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center gap-3"
                >
                  Identify Bias
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-[40px] p-12 border-4 ${currentResults?.isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}
            >
              <div className="flex items-center gap-6 mb-8">
                {currentResults?.isCorrect ? (
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-100">
                    <XCircle className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <h3 className={`text-3xl font-black ${currentResults?.isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {currentResults?.isCorrect ? "Bias Recognized!" : "Bias Misidentified"}
                  </h3>
                  <p className={`text-lg font-bold ${currentResults?.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Correct Bias: <span className="underline">{drill.correctAnswer}</span>
                  </p>
                  {mode === "review" && !currentResults?.isCorrect && (
                    <p className="text-rose-600 font-bold mt-1">
                      Your Answer: {currentResults?.selectedBias || "No answer"}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white/50 rounded-3xl p-8 mb-12">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Teaching Point</h4>
                <p className="text-lg text-slate-800 font-medium italic leading-relaxed">
                  "{drill.teachingPoint}"
                </p>
              </div>

              <div className="flex items-center gap-4">
                {mode === "review" ? (
                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => setCurrentDrillIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentDrillIndex === 0}
                      className="flex-1 px-8 py-4 bg-white/50 text-slate-600 rounded-2xl font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setCurrentDrillIndex(prev => Math.min(drills.length - 1, prev + 1))}
                      disabled={currentDrillIndex === drills.length - 1}
                      className="flex-1 px-8 py-4 bg-white/50 text-slate-600 rounded-2xl font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
                    >
                      Next
                    </button>
                  </div>
                ) : !isLastProblem ? (
                  <button 
                    onClick={handleNextProblem}
                    className="flex-1 px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
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
      </main>
    </div>
  );
}
