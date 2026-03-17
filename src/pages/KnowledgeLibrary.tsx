import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Book, Pill, Activity, FileText, 
  ChevronRight, ChevronDown, Bookmark, CheckCircle, 
  ArrowLeft, ArrowRight, Filter, Info, Star, Clock,
  RotateCw, Layout, XCircle as XCircleIcon
} from "lucide-react";
import libraryData from "../data/knowledgeLibrary.json";
import { notesService } from "../services/notesService";

type Section = "diseases" | "drugs" | "cases" | "guidelines";

export default function KnowledgeLibrary() {
  const [activeSection, setActiveSection] = useState<Section>("diseases");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = notesService.subscribeToBookmarks((data) => {
      setBookmarks(data);
    });
    return () => unsubscribe();
  }, []);

  const toggleBookmark = async (type: "diseases" | "drugs" | "cases" | "guidelines", itemId: string) => {
    await notesService.toggleBookmark(type as any, itemId);
  };

  const isBookmarked = (itemId: string) => {
    return bookmarks.some(b => b.itemId === itemId);
  };

  const addToRecent = (item: any) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem("recentlyViewed");
    if (saved) setRecentlyViewed(JSON.parse(saved));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Knowledge Library</h1>
              <p className="text-slate-500 mt-1">Structured medical learning and reference database.</p>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder={`Search ${activeSection}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 no-scrollbar">
            <TabButton 
              active={activeSection === "diseases"} 
              onClick={() => { setActiveSection("diseases"); setSelectedFilter("All"); }}
              icon={<Activity className="w-4 h-4" />}
              label="Diseases"
            />
            <TabButton 
              active={activeSection === "drugs"} 
              onClick={() => { setActiveSection("drugs"); setSelectedFilter("All"); }}
              icon={<Pill className="w-4 h-4" />}
              label="Drugs"
            />
            <TabButton 
              active={activeSection === "cases"} 
              onClick={() => { setActiveSection("cases"); setSelectedFilter("All"); }}
              icon={<FileText className="w-4 h-4" />}
              label="Case Studies"
            />
            <TabButton 
              active={activeSection === "guidelines"} 
              onClick={() => { setActiveSection("guidelines"); setSelectedFilter("All"); }}
              icon={<Layout className="w-4 h-4" />}
              label="Guidelines"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "diseases" && (
              <DiseasesSection 
                searchQuery={searchQuery} 
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                isBookmarked={isBookmarked}
                toggleBookmark={toggleBookmark}
                onView={addToRecent}
              />
            )}
            {activeSection === "drugs" && (
              <DrugsSection 
                searchQuery={searchQuery} 
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                isBookmarked={isBookmarked}
                toggleBookmark={toggleBookmark}
                onView={addToRecent}
              />
            )}
            {activeSection === "cases" && (
              <CasesSection 
                searchQuery={searchQuery}
                isBookmarked={isBookmarked}
                toggleBookmark={toggleBookmark}
                onView={addToRecent}
              />
            )}
            {activeSection === "guidelines" && (
              <GuidelinesSection 
                searchQuery={searchQuery}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                isBookmarked={isBookmarked}
                toggleBookmark={toggleBookmark}
                onView={addToRecent}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-bold text-slate-900">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentlyViewed.map((item) => (
                <div 
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setActiveSection(item.type)}
                >
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{item.type}</p>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{item.name || item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Diseases Section ---
function DiseasesSection({ searchQuery, selectedFilter, setSelectedFilter, isBookmarked, toggleBookmark, onView }: any) {
  const systems = ["All", "Cardiology", "Neurology", "Respiratory", "Gastroenterology", "Endocrinology", "Immunology"];
  
  const filtered = useMemo(() => {
    return libraryData.diseases.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           d.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === "All" || d.system === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {systems.map(s => (
          <button
            key={s}
            onClick={() => setSelectedFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedFilter === s 
                ? "bg-slate-900 text-white" 
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(disease => (
          <DiseaseCard 
            key={disease.id} 
            disease={disease} 
            isBookmarked={isBookmarked(disease.id)}
            onBookmark={() => toggleBookmark("diseases", disease.id)}
            onView={() => onView({ ...disease, type: "diseases" })}
          />
        ))}
      </div>
    </div>
  );
}

function DiseaseCard({ disease, isBookmarked, onBookmark, onView }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-md">
              {disease.system}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">{disease.name}</h3>
          </div>
          <button 
            onClick={onBookmark}
            className={`p-2 rounded-lg transition-colors ${isBookmarked ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
        
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {disease.description}
        </p>

        <button 
          onClick={() => { setIsExpanded(!isExpanded); if(!isExpanded) onView(); }}
          className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:gap-3 transition-all"
        >
          {isExpanded ? "Show Less" : "View Details"}
          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-8 space-y-6 border-t border-slate-100 mt-6">
                <DetailSection title="Symptoms" items={disease.symptoms} />
                <DetailSection title="Causes" items={disease.causes} />
                <DetailSection title="Diagnosis" items={disease.diagnosis} />
                <DetailSection title="Treatment" items={disease.treatment} />
                <DetailSection title="Prevention" items={disease.prevention} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function DetailSection({ title, items }: { title: string, items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{title}</h4>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Drugs Section ---
function DrugsSection({ searchQuery, selectedFilter, setSelectedFilter, isBookmarked, toggleBookmark, onView }: any) {
  const categories = ["All", "Statins", "Antidiabetics", "Antibiotics", "Analgesics", "Antihypertensives"];
  
  const filtered = useMemo(() => {
    return libraryData.drugs.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           d.use.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === "All" || d.category === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedFilter(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedFilter === c 
                ? "bg-slate-900 text-white" 
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(drug => (
          <DrugItem 
            key={drug.id} 
            drug={drug} 
            isBookmarked={isBookmarked(drug.id)}
            onBookmark={() => toggleBookmark("drugs", drug.id)}
            onView={() => onView({ ...drug, type: "drugs" })}
          />
        ))}
      </div>
    </div>
  );
}

function DrugItem({ drug, isBookmarked, onBookmark, onView }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{drug.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{drug.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onBookmark}
              className={`p-2 rounded-lg transition-colors ${isBookmarked ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-50"}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
            </button>
            <button 
              onClick={() => { setIsExpanded(!isExpanded); if(!isExpanded) onView(); }}
              className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 mt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Indications</h4>
                    <p className="text-sm text-slate-700">{drug.use}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dosage</h4>
                    <p className="text-sm text-slate-700">{drug.dosage}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <DetailSection title="Side Effects" items={drug.sideEffects} />
                  <DetailSection title="Contraindications" items={drug.contraindications} />
                  <DetailSection title="Interactions" items={drug.interactions} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Cases Section ---
function CasesSection({ searchQuery, isBookmarked, toggleBookmark, onView }: any) {
  const filtered = useMemo(() => {
    return libraryData.caseStudies.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filtered.map(caseStudy => (
        <CaseCard 
          key={caseStudy.id} 
          caseStudy={caseStudy} 
          isBookmarked={isBookmarked(caseStudy.id)}
          onBookmark={() => toggleBookmark("cases", caseStudy.id)}
          onView={() => onView({ ...caseStudy, type: "cases" })}
        />
      ))}
    </div>
  );
}

function CaseCard({ caseStudy, isBookmarked, onBookmark, onView }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
      >
        <div onClick={() => { setIsOpen(true); onView(); }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors pr-8">{caseStudy.title}</h3>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{caseStudy.history}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case Study</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onBookmark(); }}
          className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${isBookmarked ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-50"}`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{caseStudy.title}</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XCircleIcon className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8">
                <CaseDetailSection icon={<Clock className="w-5 h-5" />} title="Patient History" content={caseStudy.history} />
                <CaseDetailSection icon={<Activity className="w-5 h-5" />} title="Symptoms" content={caseStudy.symptoms} />
                {caseStudy.labResults && (
                  <CaseDetailSection icon={<Filter className="w-5 h-5" />} title="Lab Results" content={caseStudy.labResults} />
                )}
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900">Diagnosis</h4>
                  </div>
                  <p className="text-emerald-800 font-medium">{caseStudy.diagnosis}</p>
                </div>
                <CaseDetailSection icon={<Info className="w-5 h-5" />} title="Explanation" content={caseStudy.explanation} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Guidelines Section ---
function GuidelinesSection({ searchQuery, selectedFilter, setSelectedFilter, isBookmarked, toggleBookmark, onView }: any) {
  const categories = ["All", "General Medicine", "Cardiology Guidelines", "Emergency Protocols", "First Aid"];
  
  const filtered = useMemo(() => {
    return (libraryData as any).guidelines.filter((g: any) => {
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           g.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === "All" || g.category === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedFilter(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedFilter === c 
                ? "bg-slate-900 text-white" 
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((guideline: any) => (
          <GuidelineCard 
            key={guideline.id} 
            guideline={guideline} 
            isBookmarked={isBookmarked(guideline.id)}
            onBookmark={() => toggleBookmark("guidelines", guideline.id)}
            onView={() => onView({ ...guideline, type: "guidelines" })}
          />
        ))}
      </div>
    </div>
  );
}

function GuidelineCard({ guideline, isBookmarked, onBookmark, onView }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group relative"
      >
        <div onClick={() => { setIsOpen(true); onView(); }}>
          <div className="h-32 overflow-hidden">
            <img 
              src={guideline.image} 
              alt={guideline.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="p-6">
            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-md">
              {guideline.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">{guideline.title}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{guideline.description}</p>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onBookmark(); }}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors shadow-sm ${isBookmarked ? "text-amber-500 bg-white" : "text-white/80 bg-black/20 hover:bg-black/40"}`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{guideline.title}</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XCircleIcon className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Protocol Steps</h4>
                  <div className="space-y-3">
                    {guideline.protocol.map((step: string, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-slate-700 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <CaseDetailSection icon={<Clock className="w-5 h-5" />} title="When to Use" content={guideline.whenToUse} />
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-amber-900">Important Notes</h4>
                  </div>
                  <p className="text-amber-800 text-sm">{guideline.notes}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function CaseDetailSection({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
      </div>
      <p className="text-slate-700 leading-relaxed">{content}</p>
    </div>
  );
}
