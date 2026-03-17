import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  orderBy,
  setDoc,
  getDocs
} from "firebase/firestore";
import { db, auth } from "../firebase";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  updatedAt: any;
}

export interface Bookmark {
  id: string;
  type: "diseases" | "drugs" | "cases";
  itemId: string;
  savedAt: any;
}

export const notesService = {
  // Notes
  subscribeToNotes: (callback: (notes: Note[]) => void) => {
    if (!auth.currentUser) return () => {};
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/notes`),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      callback(notes);
    });
  },

  addNote: async (title: string, content: string) => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, `users/${auth.currentUser.uid}/notes`), {
      title,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  updateNote: async (id: string, title: string, content: string) => {
    if (!auth.currentUser) return;
    const noteRef = doc(db, `users/${auth.currentUser.uid}/notes`, id);
    await updateDoc(noteRef, {
      title,
      content,
      updatedAt: serverTimestamp()
    });
  },

  deleteNote: async (id: string) => {
    if (!auth.currentUser) return;
    const noteRef = doc(db, `users/${auth.currentUser.uid}/notes`, id);
    await deleteDoc(noteRef);
  },

  // Bookmarks
  subscribeToBookmarks: (callback: (bookmarks: Bookmark[]) => void) => {
    if (!auth.currentUser) return () => {};
    const q = query(collection(db, `users/${auth.currentUser.uid}/bookmarks`));
    return onSnapshot(q, (snapshot) => {
      const bookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
      callback(bookmarks);
    });
  },

  toggleBookmark: async (type: "diseases" | "drugs" | "cases", itemId: string) => {
    if (!auth.currentUser) return;
    const bookmarkId = `${type}_${itemId}`;
    const bookmarkRef = doc(db, `users/${auth.currentUser.uid}/bookmarks`, bookmarkId);
    
    // Check if exists
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/bookmarks`),
      where("type", "==", type),
      where("itemId", "==", itemId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/bookmarks`, snapshot.docs[0].id));
    } else {
      await setDoc(bookmarkRef, {
        type,
        itemId,
        savedAt: serverTimestamp()
      });
    }
  }
};
