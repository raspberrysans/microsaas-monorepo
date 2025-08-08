/** @format */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
	User,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
	user: User | null;
	loading: boolean;
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const signInWithEmail = async (email: string, password: string) => {
		await signInWithEmailAndPassword(auth, email, password);
	};

	const signUpWithEmail = async (email: string, password: string) => {
		const result = await createUserWithEmailAndPassword(auth, email, password);

		// Create user profile in Supabase
		if (result.user) {
			const { error } = await supabase.from('profiles').insert({
				user_id: result.user.uid,
				username: result.user.email?.split('@')[0] || '',
				display_name:
					result.user.displayName || result.user.email?.split('@')[0] || '',
				avatar_url: result.user.photoURL,
			});

			if (error) {
				console.error('Error creating user profile:', error);
			}
		}
	};

	const signInWithGoogle = async () => {
		const provider = new GoogleAuthProvider();
		const result = await signInWithPopup(auth, provider);

		// Check if user profile exists, if not create one
		if (result.user) {
			const { data: existingProfile } = await supabase
				.from('profiles')
				.select('*')
				.eq('user_id', result.user.uid)
				.single();

			if (!existingProfile) {
				const { error } = await supabase.from('profiles').insert({
					user_id: result.user.uid,
					username: result.user.email?.split('@')[0] || '',
					display_name:
						result.user.displayName || result.user.email?.split('@')[0] || '',
					avatar_url: result.user.photoURL,
				});

				if (error) {
					console.error('Error creating user profile:', error);
				}
			}
		}
	};

	const logout = async () => {
		await signOut(auth);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUser(user);
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	const value: AuthContextType = {
		user,
		loading,
		signInWithEmail,
		signUpWithEmail,
		signInWithGoogle,
		logout,
	};

	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
};
