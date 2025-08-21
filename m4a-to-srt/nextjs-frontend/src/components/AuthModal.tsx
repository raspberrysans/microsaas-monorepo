/** @format */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [resetMode, setResetMode] = useState(false);
	const [resetMessage, setResetMessage] = useState('');

	const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			if (resetMode) {
				await resetPassword(email);
				setResetMessage('Password reset email sent! Check your inbox.');
				setResetMode(false);
			} else if (isSignUp) {
				if (password !== confirmPassword) {
					throw new Error('Passwords do not match');
				}
				await signUp(email, password);
				onClose();
			} else {
				await signIn(email, password);
				onClose();
			}
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setError('');
		setLoading(true);
		try {
			await signInWithGoogle();
			onClose();
		} catch (error: unknown) {
			setError(
				error instanceof Error
					? error.message
					: 'An error occurred with Google sign in'
			);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setError('');
		setResetMessage('');
		setResetMode(false);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
						{resetMode ? 'Reset Password' : isSignUp ? 'Sign Up' : 'Sign In'}
					</h2>
					<button
						onClick={handleClose}
						className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
						disabled={loading}
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{resetMessage && (
					<div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
						<p className="text-green-800 dark:text-green-300 text-sm">
							{resetMessage}
						</p>
					</div>
				)}

				{error && (
					<div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>
							Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={loading}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
							placeholder="Enter your email"
						/>
					</div>

					{!resetMode && (
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Password
							</label>
							<input
								type="password"
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={loading}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
								placeholder="Enter your password"
							/>
						</div>
					)}

					{!resetMode && isSignUp && (
						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
							>
								Confirm Password
							</label>
							<input
								type="password"
								id="confirmPassword"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={loading}
								className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
								placeholder="Confirm your password"
							/>
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
					>
						{loading
							? 'Loading...'
							: resetMode
							? 'Send Reset Email'
							: isSignUp
							? 'Sign Up'
							: 'Sign In'}
					</button>
				</form>

				{!resetMode && (
					<>
						<div className="mt-4">
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300 dark:border-gray-600" />
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
										Or
									</span>
								</div>
							</div>
						</div>

						<button
							onClick={handleGoogleSignIn}
							disabled={loading}
							className="w-full mt-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Continue with Google
						</button>
					</>
				)}

				<div className="mt-6 text-center space-y-2">
					{!resetMode ? (
						<>
							<button
								onClick={() => setIsSignUp(!isSignUp)}
								disabled={loading}
								className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm disabled:opacity-50"
							>
								{isSignUp
									? 'Already have an account? Sign in'
									: "Don't have an account? Sign up"}
							</button>
							<br />
							<button
								onClick={() => {
									setResetMode(true);
									setError('');
								}}
								disabled={loading}
								className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm disabled:opacity-50"
							>
								Forgot your password?
							</button>
						</>
					) : (
						<button
							onClick={() => {
								setResetMode(false);
								setResetMessage('');
								setError('');
							}}
							disabled={loading}
							className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm disabled:opacity-50"
						>
							Back to sign in
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
