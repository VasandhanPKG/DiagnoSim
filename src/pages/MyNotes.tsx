import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bookmark, FileText, Plus, Search, Trash2, Edit3, 
  Save, X, Clock, Star, ChevronRight, Activity, Pill, Layout,
  AlertCircle, Book
} from "lucide-react";
import { notesService, Note, Bookmark as BookmarkType } from "../services/notesService";
import libraryData from "../data/knowledgeLibrary.json";

type Tab = "saved" | "notes" | "favorites" | "recent";

export default function MyNotes() {
  const [activeTab, setActiveTab] = useState<Tab>("saved");
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubNotes = notesService.subscribeToNotes(setNotes);
    const unsubBookmarks = notesService.subscribeToBookmarks(setBookmarks);
    
    const savedRecent = localStorage.getItem("recentlyViewed");
    if (savedRecent) setRecentlyViewed(JSON.parse(savedRecent));

    return () => {
      unsubNotes();
      unsubBookmarks();
    };
  }, []);

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    
    if (editingNote) {
      await notesService.updateNote(editingNote.id, noteTitle, noteContent);
    } else {
      await notesService.addNote(noteTitle, noteContent);
    }
    
    resetNoteForm();
  };

  const resetNoteForm = () => {
    setIsAddingNote(false);
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsAddingNote(true);
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      await notesService.deleteNote(id);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  const savedTopics = useMemo(() => {
    return bookmarks.map(b => {
      const data = (libraryData as any)[b.type]?.find((item: any) => item.id === b.itemId);
      return data ? { ...data, type: b.type } : null;
    }).filter(Boolean);
  }, [bookmarks]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Notes & Bookmarks</h1>
              <p className="text-slate-500 mt-1">Manage your saved clinical topics and personal study notes.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search your content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <button 
                onClick={() => setIsAddingNote(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Note
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 no-scrollbar">
            <TabButton active={activeTab === "saved"} onClick={() => setActiveTab("saved")} icon={<Bookmark className="w-4 h-4" />} label="Saved Topics" count={savedTopics.length} />
            <TabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")} icon={<FileText className="w-4 h-4" />} label="My Notes" count={notes.length} />
            <TabButton active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} icon={<Star className="w-4 h-4" />} label="Favorites" />
            <TabButton active={activeTab === "recent"} onClick={() => setActiveTab("recent")} icon={<Clock className="w-4 h-4" />} label="Recently Viewed" count={recentlyViewed.length} />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {isAddingNote && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-8 bg-white rounded-2xl border-2 border-indigo-100 shadow-xl overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{editingNote ? "Edit Note" : "Create New Note"}</h3>
                  <button onClick={resetNoteForm} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <input 
                  type="text"
                  placeholder="Note Title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <textarea 
                  placeholder="Write your clinical notes here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
                <div className="flex justify-end gap-3">
                  <button onClick={resetNoteForm} className="px-6 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                  <button 
                    onClick={handleSaveNote}
                    className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "saved" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTopics.length > 0 ? (
                  savedTopics.map((topic: any) => (
                    <TopicCard key={topic.id} topic={topic} onRemove={() => notesService.toggleBookmark(topic.type, topic.id)} />
                  ))
                ) : (
                  <EmptyState icon={<Bookmark className="w-12 h-12" />} title="No saved topics yet" description="Explore the library and bookmark topics to see them here." />
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note) => (
                    <NoteCard key={note.id} note={note} onEdit={() => startEdit(note)} onDelete={() => handleDeleteNote(note.id)} />
                  ))
                ) : (
                  <EmptyState icon={<FileText className="w-12 h-12" />} title="No notes found" description="Create your first clinical note to start building your knowledge base." />
                )}
              </div>
            )}

            {activeTab === "favorites" && (
              <EmptyState icon={<Star className="w-12 h-12" />} title="Favorites coming soon" description="You'll be able to mark your most important notes and topics as favorites." />
            )}

            {activeTab === "recent" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentlyViewed.length > 0 ? (
                  recentlyViewed.map((item: any) => (
                    <TopicCard key={item.id} topic={item} hideBookmark />
                  ))
                ) : (
                  <EmptyState icon={<Clock className="w-12 h-12" />} title="No recent activity" description="Topics you view in the library will appear here for quick access." />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap relative ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function TopicCard({ topic, onRemove, hideBookmark }: any) {
  const getIcon = () => {
    switch (topic.type) {
      case "diseases": return <Activity className="w-5 h-5 text-indigo-600" />;
      case "drugs": return <Pill className="w-5 h-5 text-emerald-600" />;
      case "cases": return <FileText className="w-5 h-5 text-rose-600" />;
      case "guidelines": return <Layout className="w-5 h-5 text-amber-600" />;
      default: return <Book className="w-5 h-5 text-slate-600" />;
    }
  };

  const getBg = () => {
    switch (topic.type) {
      case "diseases": return "bg-indigo-50";
      case "drugs": return "bg-emerald-50";
      case "cases": return "bg-rose-50";
      case "guidelines": return "bg-amber-50";
      default: return "bg-slate-50";
    }
  };

  return (
    <motion.div 
      layout
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${getBg()} rounded-xl flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{topic.type}</p>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {topic.name || topic.title}
            </h3>
          </div>
        </div>
        {!hideBookmark && (
          <button 
            onClick={onRemove}
            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
            title="Remove Bookmark"
          >
            <Bookmark className="w-5 h-5 fill-current" />
          </button>
        )}
      </div>
      <p className="text-sm text-slate-600 line-clamp-2 mb-4">
        {topic.description || topic.history || "No description available."}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <span className="text-xs font-medium text-slate-400">
          {topic.system || topic.category || "General"}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}

function NoteCard({ note, onEdit, onDelete }: { note: Note, onEdit: () => void, onDelete: () => void }) {
  return (
    <motion.div 
      layout
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{note.title}</h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap line-clamp-4">
        {note.content}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          {note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleDateString() : "Just now"}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, title, description }: any) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-xs">{description}</p>
    </div>
  );
}
