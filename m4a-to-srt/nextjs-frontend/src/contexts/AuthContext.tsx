/** @format */

'use client';

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from 'react';
import {
	User,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
	email: string;
	conversionsUsed: number;
	maxFreeConversions: number;
	isAdmin: boolean;
	createdAt: Date;
	lastConversionAt?: Date;
}

interface AuthContextType {
	user: User | null;
	userData: UserData | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	canUseService: () => boolean;
	incrementUsage: () => Promise<void>;
	refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [userData, setUserData] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);

	// Admin email - replace with your actual email
	const ADMIN_EMAIL =
		process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'your-admin-email@example.com';

	const googleProvider = new GoogleAuthProvider();

	const fetchUserData = useCallback(
		async (user: User) => {
			try {
				const userDoc = await getDoc(doc(db, 'users', user.uid));
				if (userDoc.exists()) {
					const data = userDoc.data();
					setUserData({
						email: data.email,
						conversionsUsed: data.conversionsUsed || 0,
						maxFreeConversions: data.isAdmin ? 999999 : 2, // Unlimited for admin
						isAdmin: data.isAdmin || false,
						createdAt: data.createdAt?.toDate() || new Date(),
						lastConversionAt: data.lastConversionAt?.toDate(),
					});
				} else {
					// Create new user document
					const isAdmin = user.email === ADMIN_EMAIL;
					const userEmail = user.email || '';
					const newUserData = {
						email: userEmail,
						conversionsUsed: 0,
						isAdmin: isAdmin,
						createdAt: new Date(),
					};
					await setDoc(doc(db, 'users', user.uid), newUserData);
					setUserData({
						...newUserData,
						maxFreeConversions: isAdmin ? 999999 : 2,
					});
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
			}
		},
		[ADMIN_EMAIL]
	);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
			setUser(user);
			if (user) {
				await fetchUserData(user);
			} else {
				setUserData(null);
			}
			setLoading(false);
		});

		return unsubscribe;
	}, [fetchUserData]);

	const refreshUserData = async () => {
		if (user) {
			await fetchUserData(user);
		}
	};

	const signIn = async (email: string, password: string) => {
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (error) {
			throw error;
		}
	};

	const signUp = async (email: string, password: string) => {
		try {
			await createUserWithEmailAndPassword(auth, email, password);
		} catch (error) {
			throw error;
		}
	};

	const signInWithGoogle = async () => {
		try {
			await signInWithPopup(auth, googleProvider);
		} catch (error) {
			throw error;
		}
	};

	const logout = async () => {
		try {
			await signOut(auth);
		} catch (error) {
			throw error;
		}
	};

	const resetPassword = async (email: string) => {
		try {
			await sendPasswordResetEmail(auth, email);
		} catch (error) {
			throw error;
		}
	};

	const canUseService = () => {
		if (!userData) return false;
		return (
			userData.isAdmin || userData.conversionsUsed < userData.maxFreeConversions
		);
	};

	const incrementUsage = async () => {
		if (!user || !userData) return;

		try {
			const userRef = doc(db, 'users', user.uid);
			await updateDoc(userRef, {
				conversionsUsed: increment(1),
				lastConversionAt: new Date(),
			});

			// Update local state
			setUserData((prev) =>
				prev
					? {
							...prev,
							conversionsUsed: prev.conversionsUsed + 1,
							lastConversionAt: new Date(),
					  }
					: null
			);
		} catch (error) {
			console.error('Error incrementing usage:', error);
			throw error;
		}
	};

	const value: AuthContextType = {
		user,
		userData,
		loading,
		signIn,
		signUp,
		signInWithGoogle,
		logout,
		resetPassword,
		canUseService,
		incrementUsage,
		refreshUserData,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
