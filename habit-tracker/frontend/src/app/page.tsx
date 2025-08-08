/** @format */

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
	const { user, loading } = useAuth();
	const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-pulse text-lg">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="w-full max-w-6xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-gray-900 mb-4">
							Habit Tracker
						</h1>
						<p className="text-xl text-gray-600 mb-8">
							Track your habits in an aesthetic way
						</p>
					</div>
					<AuthForm
						mode={authMode}
						onToggleMode={() =>
							setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
						}
					/>
				</div>
			</div>
		);
	}

	return <Dashboard />;
}
