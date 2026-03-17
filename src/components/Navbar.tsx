import { Link, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Stethoscope, LayoutDashboard, BookOpen, BarChart3, LogOut, Brain, Bookmark } from "lucide-react";
import { motion } from "motion/react";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: "/cognitive-training", label: "Cognitive Training", icon: <Brain className="w-4 h-4" /> },
    { path: "/library", label: "Library", icon: <BookOpen className="w-4 h-4" /> },
    { path: "/notes", label: "My Notes", icon: <Bookmark className="w-4 h-4" /> },
    { path: "/performance", label: "Performance", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 px-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-8">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-100"
          >
            <Stethoscope className="w-5 h-5 text-white" />
          </motion.div>
          <span className="font-bold text-xl tracking-tight group-hover:text-indigo-600 transition-colors">DiagnoSim</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 group ${
                location.pathname === item.path
                  ? "text-indigo-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {location.pathname === item.path && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute inset-0 bg-slate-100 rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100"
        >
          <img 
            src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}`} 
            alt="Profile" 
            className="w-6 h-6 rounded-full ring-2 ring-white"
          />
          <span className="text-xs font-semibold text-slate-700">{auth.currentUser?.displayName?.split(" ")[0]}</span>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.1, color: "#e11d48" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => signOut(auth)}
          className="p-2 text-slate-400 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.nav>
  );
}
