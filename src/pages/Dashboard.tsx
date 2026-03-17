import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { PatientCase, UserProfile } from "../types";
import { Plus, Clock, ChevronRight, Activity, AlertCircle, Lock, Unlock, Trophy, Calendar, X, BookOpen, Flame } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { geminiService } from "../services/gemini";
import curriculumData from "../data/curriculum.json";
import { DISEASE_DATA } from "../data/diseases";
import { motion, AnimatePresence } from "motion/react";

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

export default function Dashboard() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicalTerm, setMedicalTerm] = useState<{ term: string; definition: string } | null>(null);
  const [isGeneratingTerm, setIsGeneratingTerm] = useState(false);
  const [showTermDefinition, setShowTermDefinition] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchMedicalTerm();
  }, []);

  const fetchMedicalTerm = async (force = false) => {
    // Check cache first
    const cached = localStorage.getItem("medical_term_cache");
    if (cached && !force) {
      const { term, timestamp } = JSON.parse(cached);
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp < oneDay) {
        setMedicalTerm(term);
        return;
      }
    }

    setIsGeneratingTerm(true);
    try {
      const term = await geminiService.generateMedicalTerm();
      setMedicalTerm(term);
      localStorage.setItem("medical_term_cache", JSON.stringify({
        term,
        timestamp: Date.now()
      }));
    } catch (err) {
      // Error is already handled/silenced in geminiService fallback
    } finally {
      setIsGeneratingTerm(false);
    }
  };

  const fetchData = async () => {
    if (!auth.currentUser) return;
    try {
      // Fetch User Profile
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
      }

      // Fetch Cases
      const q = query(
        collection(db, "cases"),
        where("studentId", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const casesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientCase));
      setCases(casesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const startCurriculumCase = async (level: number, disease: string) => {
    if (!auth.currentUser || !userProfile) return;
    if (level > (userProfile.unlockedLevel || 1)) return;

    setIsStarting(true);
    setError(null);
    try {
      const caseData = await geminiService.generateCase(disease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: disease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "curriculum",
        level,
        chatLimit: 10 + (level * 2), // Increasing difficulty
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start simulation.");
      }
      setIsStarting(false);
    }
  };

  const startDailyChallenge = async () => {
    if (!auth.currentUser) return;
    setIsStarting(true);
    setError(null);
    try {
      // Check if daily challenge already exists for today
      const today = format(new Date(), "yyyy-MM-dd");
      const q = query(
        collection(db, "cases"),
        where("studentId", "==", auth.currentUser.uid),
        where("type", "==", "daily"),
        where("createdAt", ">=", today)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        navigate(`/simulation/${snap.docs[0].id}`);
        return;
      }

      const randomDisease = curriculumData[Math.floor(Math.random() * curriculumData.length)].disease;
      const caseData = await geminiService.generateCase(randomDisease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: randomDisease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "daily",
        chatLimit: 15,
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start daily challenge.");
      }
      setIsStarting(false);
    }
  };

  const startPracticeCase = async (disease: string) => {
    if (!auth.currentUser) return;
    setIsStarting(true);
    setError(null);
    setIsStarting(true);
    setError(null);
    setShowPracticeModal(false);
    try {
      const caseData = await geminiService.generateCase(disease);
      
      const docRef = await addDoc(collection(db, "cases"), {
        ...caseData,
        diseaseId: disease,
        studentId: auth.currentUser.uid,
        status: "active",
        type: "practice",
        chatLimit: 20, // Practice sessions have more questions
        chatCount: 0,
        createdAt: new Date().toISOString()
      });
      
      navigate(`/simulation/${docRef.id}`);
    } catch (err: any) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(err.message || "Failed to start practice session.");
      }
      setIsStarting(false);
    }
  };

  const unlockedLevel = userProfile?.unlockedLevel || 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="max-w-7xl mx-auto px-6 py-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Medical Simulation Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, Dr. {auth.currentUser?.displayName?.split(" ")[0]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPracticeModal(true)}
            disabled={isStarting}
            className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Practice Session
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startDailyChallenge}
            disabled={isStarting}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-100 disabled:opacity-50"
          >
            <Calendar className="w-5 h-5" />
            Daily Challenge
          </motion.button>
          {error && <p className="text-rose-600 text-xs font-medium">{error}</p>}
        </div>
      </motion.div>

      {/* Practice Modal */}
      <AnimatePresence>
        {showPracticeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Select Disease</h3>
                <button onClick={() => setShowPracticeModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {DISEASE_DATA.map((disease) => (
                  <button
                    key={disease.name}
                    onClick={() => startPracticeCase(disease.name)}
                    className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-between group"
                  >
                    <span className="font-bold text-slate-700 group-hover:text-indigo-700">{disease.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-50 text-center">
                <p className="text-xs text-slate-400">Practice sessions do not count towards curriculum progress.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Learning Path */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
              <Trophy className="w-5 h-5 text-indigo-600" />
              Curriculum Progression
            </div>
            <div className="text-sm font-medium text-slate-500">
              Level {unlockedLevel} / 50
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {curriculumData.slice(0, Math.min(unlockedLevel + 2, 50)).map((item) => {
              const isLocked = item.level > unlockedLevel;
              const isCompleted = item.level < unlockedLevel;

              return (
                <motion.div
                  key={item.level}
                  whileHover={!isLocked ? { y: -4, scale: 1.01 } : {}}
                  whileTap={!isLocked ? { scale: 0.98 } : {}}
                  onClick={() => !isLocked && startCurriculumCase(item.level, item.disease)}
                  className={`p-6 rounded-2xl border transition-all relative overflow-hidden group ${
                    isLocked 
                      ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed" 
                      : "bg-white border-slate-100 shadow-sm hover:shadow-md cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isLocked ? 'text-slate-400' : 'text-indigo-600'}`}>
                      Level {item.level}
                    </span>
                    {isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : isCompleted ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />}
                  </div>
                  <h3 className={`font-bold text-lg ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>{item.title}</h3>
                  <p className={`text-sm mt-1 line-clamp-2 ${isLocked ? 'text-slate-300' : 'text-slate-500'}`}>{item.description}</p>
                  
                  {!isLocked && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start Simulation <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Sidebar: Recent Activity & Stats */}
        <div className="space-y-6">
          {/* Medical Term of the Day */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Term of the Day
              </h3>
              <button 
                onClick={() => fetchMedicalTerm(true)}
                disabled={isGeneratingTerm}
                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                title="Generate New Term"
              >
                <Plus className={`w-4 h-4 text-slate-400 ${isGeneratingTerm ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {medicalTerm ? (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowTermDefinition(!showTermDefinition)}
                  className="w-full text-left p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all group/term"
                >
                  <div className="text-indigo-700 font-black text-lg tracking-tight group-hover/term:scale-[1.02] transition-transform">
                    {medicalTerm.term}
                  </div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                    Click to {showTermDefinition ? 'hide' : 'reveal'} definition
                  </div>
                </button>
                
                <AnimatePresence>
                  {showTermDefinition && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                          {medicalTerm.definition}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">Learning Progress</h3>
            <div className="space-y-8">
              <StatItem label="Total Cases" value={cases.length.toString()} />
              <StatItem label="Curriculum" value={`${Math.round(((unlockedLevel - 1) / 50) * 100)}%`} />
              <div className="flex items-center gap-4">
                <StatItem label="Daily Streak" value={`${userProfile?.streak || 0} days`} />
                {(userProfile?.streak || 0) > 0 && (
                  <div className="bg-amber-500/20 p-2 rounded-full">
                    <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Knowledge Library Quick Access */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4 }}
            onClick={() => navigate("/library")}
            className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <BookOpen className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Knowledge Library</h3>
              <p className="text-indigo-100 text-sm mb-4">Explore diseases, drugs, and more.</p>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1.5 rounded-lg">
                Open Library <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <div className="text-3xl font-bold mb-1 tracking-tight">{value}</div>
      <div className="text-slate-400 text-sm font-medium">{label}</div>
    </div>
  );
}
