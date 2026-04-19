import { UserKit, Comment, Feedback } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  updateDoc, 
  addDoc, 
  onSnapshot 
} from 'firebase/firestore';

export const saveKit = async (kit: UserKit) => {
  if (!auth.currentUser) {
    // Fallback to local storage for anonymous users if needed
    const kits = getSavedKitsLocal();
    const index = kits.findIndex(k => k.id === kit.id);
    const kitToSave = { ...kit, updatedAt: Date.now() };
    if (index >= 0) kits[index] = kitToSave;
    else kits.push(kitToSave);
    localStorage.setItem('launchkit_saved_projects', JSON.stringify(kits));
    return;
  }

  try {
    const kitToSave = { 
      ...kit, 
      ownerId: kit.ownerId || auth.currentUser.uid,
      updatedAt: Date.now() 
    };
    await setDoc(doc(db, 'kits', kit.id), kitToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `kits/${kit.id}`);
  }
};

export const updateDeliverableFeedback = async (kitId: string, deliverableId: string, feedback: Feedback) => {
  try {
    const kitRef = doc(db, 'kits', kitId);
    const kitSnap = await getDoc(kitRef);
    if (!kitSnap.exists()) throw new Error('Kit not found');
    
    const kit = kitSnap.data() as UserKit;
    const deliverables = kit.deliverables.map(d => 
      d.id === deliverableId ? { ...d, feedback } : d
    );
    
    await updateDoc(kitRef, { deliverables, updatedAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `kits/${kitId}`);
  }
};

export const addCollaborator = async (kitId: string, email: string, role: 'editor' | 'viewer') => {
  try {
    const kitRef = doc(db, 'kits', kitId);
    const kitSnap = await getDoc(kitRef);
    if (!kitSnap.exists()) throw new Error('Kit not found');
    
    const kitArr = (kitSnap.data() as UserKit).collaborators || [];
    if (kitArr.some(c => c.email === email)) return; // Already a collaborator
    
    await updateDoc(kitRef, { 
      collaborators: [...kitArr, { email, role }],
      updatedAt: Date.now() 
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `kits/${kitId}`);
  }
};

export const removeCollaborator = async (kitId: string, email: string) => {
  try {
    const kitRef = doc(db, 'kits', kitId);
    const kitSnap = await getDoc(kitRef);
    if (!kitSnap.exists()) throw new Error('Kit not found');
    
    const kitArr = (kitSnap.data() as UserKit).collaborators || [];
    await updateDoc(kitRef, { 
      collaborators: kitArr.filter(c => c.email !== email),
      updatedAt: Date.now() 
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `kits/${kitId}`);
  }
};

export const addComment = async (comment: Omit<Comment, 'id' | 'createdAt'>) => {
  try {
    const commentsRef = collection(db, 'kits', comment.kitId, 'comments');
    await addDoc(commentsRef, {
      ...comment,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `kits/${comment.kitId}/comments`);
  }
};

export const subscribeToComments = (kitId: string, onUpdate: (comments: Comment[]) => void) => {
  const q = query(
    collection(db, 'kits', kitId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
    onUpdate(comments);
  });
};

export const deleteComment = async (kitId: string, commentId: string) => {
  try {
    await deleteDoc(doc(db, 'kits', kitId, 'comments', commentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `kits/${kitId}/comments/${commentId}`);
  }
};

export const getSavedKits = async (): Promise<UserKit[]> => {
  if (!auth.currentUser) return getSavedKitsLocal();

  const kits: UserKit[] = [];

  // 1. Get kits where user is owner
  try {
    const qOwner = query(
      collection(db, 'kits'), 
      where('ownerId', '==', auth.currentUser.uid)
    );
    const ownerSnap = await getDocs(qOwner);
    kits.push(...ownerSnap.docs.map(doc => doc.data() as UserKit));
  } catch (error) {
    console.error("Error fetching owned kits:", error);
  }

  // 2. Get kits where user is collaborator
  if (auth.currentUser.email) {
    try {
      const qCollab = query(
        collection(db, 'kits'),
        where('collaborators', 'array-contains-any', [
          { email: auth.currentUser.email, role: 'editor' },
          { email: auth.currentUser.email, role: 'viewer' }
        ])
      );
      const collabSnap = await getDocs(qCollab);
      kits.push(...collabSnap.docs.map(doc => doc.data() as UserKit));
    } catch (error) {
      console.error("Error fetching collaborated kits:", error);
    }
  }

  if (kits.length === 0 && !auth.currentUser.isAnonymous) {
    // If no kits found in Firestore, check local storage as a fallback
    const local = getSavedKitsLocal();
    if (local.length > 0) kits.push(...local);
  }

  // Deduplicate and sort
  const uniqueKits = Array.from(new Map(kits.map(k => [k.id, k])).values());
  return uniqueKits.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
};

const getSavedKitsLocal = (): UserKit[] => {
  try {
    const data = localStorage.getItem('launchkit_saved_projects');
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

export const deleteKit = async (id: string) => {
  if (!auth.currentUser) {
    const kits = getSavedKitsLocal().filter(k => k.id !== id);
    localStorage.setItem('launchkit_saved_projects', JSON.stringify(kits));
    return;
  }

  try {
    await deleteDoc(doc(db, 'kits', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `kits/${id}`);
  }
};
