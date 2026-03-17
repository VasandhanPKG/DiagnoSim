import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ArrowLeft, ChevronRight, Search, Eye, ListFilter, Shield, BarChart, AlertTriangle, Lock, CheckCircle2, XCircle } from "lucide-react";

// Import game components
import SignalDetectionGame from "../components/signalDetection/SignalDetectionGame";
import PatternRecognitionGame from "../components/training/PatternRecognitionGame";
import HypothesisGenerationGame from "../components/training/HypothesisGenerationGame";
import LogicalEliminationGame from "../components/training/LogicalEliminationGame";
import ProbabilisticThinkingGame from "../components/training/ProbabilisticThinkingGame";
import BiasRecognitionGame from "../components/training/BiasRecognitionGame";

// Import data
import signalData from "../data/signalDetectionData.json";
import patternData from "../data/training/patternRecognition.json";
import hypothesisData from "../data/training/hypothesisGeneration.json";
import eliminationData from "../data/training/logicalElimination.json";
import probabilityData from "../data/training/probabilisticThinking.json";
import biasData from "../data/training/biasRecognition.json";

const SKILLS = [
  {
    id: "signal-detection",
    name: "Signal Detection",
    icon: <Search className="w-6 h-6" />,
    color: "indigo",
    data: signalData,
    component: SignalDetectionGame
  },
  {
    id: "pattern-recognition",
    name: "Pattern Recognition",
    icon: <Eye className="w-6 h-6" />,
    color: "emerald",
    data: patternData,
    component: PatternRecognitionGame
  },
  {
    id: "hypothesis-generation",
    name: "Hypothesis Generation",
    icon: <ListFilter className="w-6 h-6" />,
    color: "amber",
    data: hypothesisData,
    component: HypothesisGenerationGame
  },
  {
    id: "logical-elimination",
    name: "Logical Elimination",
    icon: <Shield className="w-6 h-6" />,
    color: "rose",
    data: eliminationData,
    component: LogicalEliminationGame
  },
  {
    id: "probabilistic-thinking",
    name: "Probabilistic Thinking",
    icon: <BarChart className="w-6 h-6" />,
    color: "violet",
    data: probabilityData,
    component: ProbabilisticThinkingGame
  },
  {
    id: "bias-recognition",
    name: "Bias Recognition",
    icon: <AlertTriangle className="w-6 h-6" />,
    color: "orange",
    data: biasData,
    component: BiasRecognitionGame
  }
];

export default function TrainingOverview() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    const savedProgress = localStorage.getItem("trainingProgress");
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    } else {
      setProgress({});
    }
  }, []);

  const skillProgress = progress?.[skillId || ""] || { unlockedStage: 1, completedStages: {} };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  } as const;

  const selectedSkill = SKILLS.find(s => s.id === skillId);

  useEffect(() => {
    if (!selectedSkill) {
      navigate("/cognitive-training");
    }
  }, [selectedSkill, navigate]);

  if (!selectedSkill || !progress) return null;

  const handleLaunchDrill = () => {
    setIsGameActive(true);
  };

  const handleGameComplete = (stageId: number, score: number, results: any[]) => {
    setIsGameActive(false);
    
    const isPassed = score >= 80;
    const newProgress = { ...progress };
    if (!newProgress[skillId!]) {
      newProgress[skillId!] = { unlockedStage: 1, completedStages: {} };
    }

    newProgress[skillId!].completedStages[stageId] = {
      passed: isPassed,
      score: score,
      results: results,
      timestamp: new Date().toISOString()
    };

    if (isPassed && stageId === newProgress[skillId!].unlockedStage) {
      newProgress[skillId!].unlockedStage = stageId + 1;
    }

    setProgress(newProgress);
    localStorage.setItem("trainingProgress", JSON.stringify(newProgress));
  };

  if (isGameActive) {
    const GameComponent = selectedSkill.component;
    const stages = (selectedSkill.data as any).stages || (selectedSkill.data as any).progressionStages;
    const stageInfo = stages.find((s: any) => (s.id !== undefined ? s.id === currentStage : s.stage === currentStage));
    const isReview = !!skillProgress.completedStages[currentStage] && skillProgress.completedStages[currentStage].passed;
    
    return (
      <GameComponent 
        stage={stageInfo} 
        mode={isReview ? "review" : "drill"}
        reviewData={isReview ? skillProgress.completedStages[currentStage] : null}
        onComplete={(score: number, results: any[]) => handleGameComplete(currentStage, score, results)} 
        onCancel={() => setIsGameActive(false)}
      />
    );
  }

  const stages = (selectedSkill.data as any).stages || (selectedSkill.data as any).progressionStages || [];
  const isCurrentStageUnlocked = currentStage <= skillProgress.unlockedStage;
  const isCurrentStageCompleted = !!skillProgress.completedStages[currentStage];
  const isCurrentStagePassed = skillProgress.completedStages[currentStage]?.passed;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/cognitive-training")} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
            title="Back to Training Lab"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${selectedSkill.color}-50 text-${selectedSkill.color}-600`}>
              {selectedSkill.icon}
            </div>
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Training Session</div>
              <div className="text-lg font-black text-slate-900">{selectedSkill.name}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div variants={itemVariants}>
              <h2 className="text-4xl font-black text-slate-900 mb-6">{selectedSkill.name}</h2>
              <p className="text-lg text-slate-500 mb-10 leading-relaxed">
                {(selectedSkill.data as any).description || "Master this diagnostic cognitive skill through progressive drills."}
              </p>
              
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Training Stages</h4>
                <div className="flex flex-wrap gap-4">
                  {stages.map((stage: any) => {
                    const stageId = stage.id !== undefined ? stage.id : stage.stage;
                    const isUnlocked = stageId <= skillProgress.unlockedStage;
                    const isCompleted = !!skillProgress.completedStages[stageId];
                    const isPassed = skillProgress.completedStages[stageId]?.passed;

                    return (
                      <button
                        key={stageId}
                        onClick={() => isUnlocked && setCurrentStage(stageId)}
                        className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
                          currentStage === stageId
                            ? `bg-${selectedSkill.color}-600 text-white shadow-lg shadow-${selectedSkill.color}-100`
                            : isUnlocked
                              ? "bg-white border border-slate-200 text-slate-600 hover:border-indigo-200"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        }`}
                      >
                        {isCompleted ? (
                          isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />
                        ) : !isUnlocked ? (
                          <Lock className="w-4 h-4" />
                        ) : null}
                        Stage {stageId}: {stage.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-slate-50 rounded-[32px] p-10 flex flex-col items-center justify-center text-center">
              <div className={`w-20 h-20 bg-${selectedSkill.color}-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-${selectedSkill.color}-100 text-white`}>
                {selectedSkill.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">
                {isCurrentStageCompleted ? "Review Stage" : isCurrentStageUnlocked ? "Ready to Train?" : "Stage Locked"}
              </h3>
              <p className="text-slate-500 mb-10 max-w-sm">
                {isCurrentStageCompleted 
                  ? `You have completed Stage ${currentStage}. You can review your results and remarks.`
                  : isCurrentStageUnlocked 
                    ? `Launch a randomized drill for ${selectedSkill.name} at Stage ${currentStage}.`
                    : `Complete Stage ${currentStage - 1} with at least 80% to unlock this stage.`}
              </p>
              {isCurrentStageUnlocked && (
                <button
                  onClick={handleLaunchDrill}
                  className={`w-full bg-${selectedSkill.color}-600 text-white py-5 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-${selectedSkill.color}-100 flex items-center justify-center gap-3 group`}
                >
                  {isCurrentStageCompleted 
                    ? (isCurrentStagePassed ? "Review Drill" : "Re-attempt Drill") 
                    : "Launch Drill"}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
