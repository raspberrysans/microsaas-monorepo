/** @format */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/Card';

interface AuthFormProps {
	mode: 'signin' | 'signup';
	onToggleMode: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onToggleMode }) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			if (mode === 'signin') {
				await signInWithEmail(email, password);
			} else {
				await signUpWithEmail(email, password);
			}
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setLoading(true);
		setError('');

		try {
			await signInWithGoogle();
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
				<CardDescription>
					{mode === 'signin'
						? 'Welcome back! Sign in to your account.'
						: 'Create a new account to get started.'}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					{error && <div className="text-red-500 text-sm">{error}</div>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
					</Button>
				</form>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with
						</span>
					</div>
				</div>

				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={handleGoogleSignIn}
					disabled={loading}
				>
					Google
				</Button>

				<div className="text-center text-sm">
					{mode === 'signin' ? (
						<>
							Don&apos;t have an account?{' '}
							<button
								type="button"
								className="text-primary hover:underline"
								onClick={onToggleMode}
							>
								Sign up
							</button>
						</>
					) : (
						<>
							Already have an account?{' '}
							<button
								type="button"
								className="text-primary hover:underline"
								onClick={onToggleMode}
							>
								Sign in
							</button>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
