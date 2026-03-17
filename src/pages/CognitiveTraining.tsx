import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Target, Shield, Zap, Search, Eye, ListFilter, BarChart, AlertTriangle, ChevronRight, Trophy } from "lucide-react";

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
    description: "Identify clinically relevant findings from a noisy presentation.",
    icon: <Search className="w-6 h-6" />,
    color: "indigo",
    data: signalData,
    component: SignalDetectionGame
  },
  {
    id: "pattern-recognition",
    name: "Pattern Recognition",
    description: "Match symptoms to known disease templates instantly.",
    icon: <Eye className="w-6 h-6" />,
    color: "emerald",
    data: patternData,
    component: PatternRecognitionGame
  },
  {
    id: "hypothesis-generation",
    name: "Hypothesis Generation",
    description: "Generate and rank a systematic differential diagnosis list.",
    icon: <ListFilter className="w-6 h-6" />,
    color: "amber",
    data: hypothesisData,
    component: HypothesisGenerationGame
  },
  {
    id: "logical-elimination",
    name: "Logical Elimination",
    description: "Actively rule out diagnoses using clinical evidence.",
    icon: <Shield className="w-6 h-6" />,
    color: "rose",
    data: eliminationData,
    component: LogicalEliminationGame
  },
  {
    id: "probabilistic-thinking",
    name: "Probabilistic Thinking",
    description: "Rank diagnoses by likelihood based on demographics.",
    icon: <BarChart className="w-6 h-6" />,
    color: "violet",
    data: probabilityData,
    component: ProbabilisticThinkingGame
  },
  {
    id: "bias-recognition",
    name: "Bias Recognition",
    description: "Identify and correct your own cognitive errors.",
    icon: <AlertTriangle className="w-6 h-6" />,
    color: "orange",
    data: biasData,
    component: BiasRecognitionGame
  }
];

export default function CognitiveTraining() {
  const navigate = useNavigate();
  
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

  const handleSelectSkill = (skillId: string) => {
    navigate(`/training/${skillId}`);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-6 py-12"
    >
      <motion.div variants={itemVariants} className="mb-16">
        <div className="flex items-center gap-3 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-4">
          <Brain className="w-5 h-5" />
          Diagnostic Excellence
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">
          Cognitive <span className="text-indigo-600">Training Lab</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-3xl">
          Master the cognitive skills required for expert diagnosis. Each module targets a specific 
          mental process to help you think like a senior clinician.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {SKILLS.map((skill) => (
          <motion.button
            key={skill.id}
            variants={itemVariants}
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectSkill(skill.id)}
            className={`p-8 rounded-[40px] text-left transition-all border-2 group bg-white border-slate-100 text-slate-900 hover:border-indigo-200`}
          >
            <div className={`p-4 rounded-2xl w-fit mb-8 bg-${skill.color}-50`}>
              {skill.icon}
            </div>
            <h3 className="text-2xl font-black mb-3">{skill.name}</h3>
            <p className={`text-sm leading-relaxed mb-8 text-slate-500`}>
              {skill.description}
            </p>
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600`}>
              Launch Drill
              <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform`} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
