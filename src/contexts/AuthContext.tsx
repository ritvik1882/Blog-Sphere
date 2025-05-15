
"use client";

import type { AuthenticatedUser } from '@/lib/types';
import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (credentials: { email: string; pass: string }) => Promise<void>;
  signup: (details: { name: string, email: string; pass: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (details: { name?: string; bio?: string; avatarUrl?: string; email?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_AVATAR_URL = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const firestoreUser = userSnap.data();
          setUser({
            id: firebaseUser.uid, // Firebase UID
            name: firestoreUser.name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            email: firebaseUser.email,
            avatarUrl: firestoreUser.avatarUrl || firebaseUser.photoURL || undefined,
            bio: firestoreUser.bio || '',
          });
        } else {
          // This case might happen if a user exists in Firebase Auth but not Firestore
          // e.g. if Firestore document creation failed during signup or manual deletion.
          // We'll create a basic user profile from Firebase Auth data.
           const nameFromAuth = firebaseUser.displayName;
           const emailNamePart = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User';
           const profileName = nameFromAuth || emailNamePart;

           const newUserProfileData = {
            name: profileName,
            email: firebaseUser.email,
            avatarUrl: firebaseUser.photoURL || DEFAULT_AVATAR_URL,
            bio: '', // Default bio for this failsafe scenario
            createdAt: serverTimestamp(),
          };
          // Attempt to create the profile document in Firestore
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), newUserProfileData);
             setUser({
                id: firebaseUser.uid,
                name: newUserProfileData.name,
                email: newUserProfileData.email,
                avatarUrl: newUserProfileData.avatarUrl,
                bio: newUserProfileData.bio,
             });
          } catch (profileError) {
             console.error("Error creating missing Firestore profile in onAuthStateChanged:", profileError);
             // Fallback to just auth data if Firestore write fails
             setUser({
                id: firebaseUser.uid,
                name: profileName, // Use the derived profileName
                email: firebaseUser.email,
                avatarUrl: firebaseUser.photoURL || undefined,
                bio: '',
              });
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: { email: string; pass: string }) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.pass);
      // onAuthStateChanged will handle setting user state and fetching profile
      // router.push('/'); // Navigation handled by login page on success
      // Toast is now handled by onAuthStateChanged or can be added here if needed
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({ title: "Login Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      setIsLoading(false); // Ensure loading is false on error
      throw error; // Re-throw to be caught by the form
    }
    // setIsLoading(false) is handled by onAuthStateChanged or error path
  };

  const signup = async (details: { name: string, email: string; pass: string }) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, details.email, details.pass);
      const firebaseNewUser = userCredential.user;

      const defaultAvatar = DEFAULT_AVATAR_URL;

      // Update Firebase Auth profile
      await updateFirebaseProfile(firebaseNewUser, {
        displayName: details.name,
        photoURL: defaultAvatar
      });

      // Create user document in Firestore
      const userProfileData = {
        name: details.name, // Use the name from the form directly
        email: details.email,
        avatarUrl: defaultAvatar,
        bio: 'Newly registered user.', // Default bio
        createdAt: serverTimestamp(), // Firestore server-side timestamp
      };
      await setDoc(doc(db, 'users', firebaseNewUser.uid), userProfileData);
      
      // onAuthStateChanged will eventually pick up these changes and set the user state.
      // To provide immediate feedback, we could also setUser here, but it might conflict with onAuthStateChanged.
      // Forcing a state update here for immediate reflection might be good, but let onAuthStateChanged be the source of truth.
      // router.push('/'); // Navigation handled by signup page on success
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({ title: "Signup Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      setIsLoading(false); // Ensure loading is false on error
      throw error; // Re-throw to be caught by the form
    }
    // setIsLoading(false); // Let onAuthStateChanged handle the final isLoading state.
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set user to null
      router.push('/');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
       setIsLoading(false);
    }
  };

  const updateProfile = async (profileDetails: { name?: string; bio?: string; avatarUrl?: string; email?: string }) => {
    if (!auth.currentUser) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const currentUser = auth.currentUser;
    const currentUserId = currentUser.uid;
    
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    const firestoreUpdates: { name?: string; bio?: string; avatarUrl?: string, email?:string, lastUpdatedAt?: any } = {};
    firestoreUpdates.lastUpdatedAt = serverTimestamp();

    if (profileDetails.name && profileDetails.name !== user?.name) {
      authUpdates.displayName = profileDetails.name;
      firestoreUpdates.name = profileDetails.name;
    }
    // Email updates are complex and typically require re-authentication, so we'll only update it in Firestore for display.
    // The actual Firebase Auth email is not changed here.
    if (profileDetails.email && profileDetails.email !== user?.email && profileDetails.email !== currentUser.email) {
        firestoreUpdates.email = profileDetails.email; // This only updates the Firestore record's email field
    }
    if (profileDetails.bio !== undefined && profileDetails.bio !== user?.bio) { 
      firestoreUpdates.bio = profileDetails.bio;
    }
    if (profileDetails.avatarUrl && profileDetails.avatarUrl !== user?.avatarUrl) {
      authUpdates.photoURL = profileDetails.avatarUrl;
      firestoreUpdates.avatarUrl = profileDetails.avatarUrl;
    } else if (profileDetails.avatarUrl === '' && user?.avatarUrl) { // Clearing avatar URL
      const defaultAvatar = DEFAULT_AVATAR_URL;
      authUpdates.photoURL = defaultAvatar; // Reset to default
      firestoreUpdates.avatarUrl = defaultAvatar; // Reset to default
    }


    try {
      if (Object.keys(authUpdates).length > 0) {
        await updateFirebaseProfile(currentUser, authUpdates);
      }

      if (Object.keys(firestoreUpdates).length > 1) { // Greater than 1 because lastUpdatedAt is always there
        const userRef = doc(db, 'users', currentUserId);
        await updateDoc(userRef, firestoreUpdates);
      }
      
      const updatedUserFields: Partial<AuthenticatedUser> = {};
      if (firestoreUpdates.name) updatedUserFields.name = firestoreUpdates.name;
      if (firestoreUpdates.email && user) updatedUserFields.email = user.email; // Keep original email from auth context for consistency
      if (firestoreUpdates.bio !== undefined) updatedUserFields.bio = firestoreUpdates.bio;
      if (firestoreUpdates.avatarUrl) updatedUserFields.avatarUrl = firestoreUpdates.avatarUrl;
      
      if(user && Object.keys(updatedUserFields).length > 0) {
        setUser({ ...user, ...updatedUserFields });
      }

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update profile.", variant: "destructive" });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
