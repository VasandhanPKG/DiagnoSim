import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { motion, AnimatePresence } from "motion/react";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Simulation from "./pages/Simulation";
import Result from "./pages/Result";
import KnowledgeLibrary from "./pages/KnowledgeLibrary";
import MyNotes from "./pages/MyNotes";
import Performance from "./pages/Performance";
import CognitiveTraining from "./pages/CognitiveTraining";
import TrainingOverview from "./pages/TrainingOverview";
import Navbar from "./components/Navbar";

function AnimatedRoutes({ user }: { user: User | null }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/simulation/:caseId" element={user ? <Simulation /> : <Navigate to="/" />} />
        <Route path="/result/:attemptId" element={user ? <Result /> : <Navigate to="/" />} />
        <Route path="/library" element={user ? <KnowledgeLibrary /> : <Navigate to="/" />} />
        <Route path="/notes" element={user ? <MyNotes /> : <Navigate to="/" />} />
        <Route path="/performance" element={user ? <Performance /> : <Navigate to="/" />} />
        <Route path="/cognitive-training" element={user ? <CognitiveTraining /> : <Navigate to="/" />} />
        <Route path="/training/:skillId" element={user ? <TrainingOverview /> : <Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading DiagnoSim...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {user && <Navbar />}
        <main className={user ? "pt-16" : ""}>
          <AnimatedRoutes user={user} />
        </main>
      </div>
    </Router>
  );
}
