/** @format */

'use client';

import { useState, useCallback } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { ConversionSettings } from '@/components/ConversionSettings';
import { ConversionResult } from '@/components/ConversionResult';
import { AuthModal } from '@/components/AuthModal';
import { UsageStatus } from '@/components/UsageStatus';
import { useAuth } from '@/contexts/AuthContext';

interface ConversionState {
	status: 'idle' | 'uploading' | 'converting' | 'success' | 'error';
	progress?: number;
	error?: string;
	downloadUrl?: string;
	filename?: string;
}

export default function Home() {
	const { user, userData, loading, canUseService, incrementUsage, logout } =
		useAuth();
	const [file, setFile] = useState<File | null>(null);
	const [conversionState, setConversionState] = useState<ConversionState>({
		status: 'idle',
	});
	const [showAuthModal, setShowAuthModal] = useState(false);

	const [settings, setSettings] = useState({
		wordsPerSegment: 1,
		frameRate: 30.0,
	});

	const handleFileSelect = useCallback((selectedFile: File) => {
		setFile(selectedFile);
		setConversionState({ status: 'idle' });
	}, []);

	const handleConvert = useCallback(async () => {
		if (!file) return;

		// Check if user is authenticated
		if (!user) {
			setShowAuthModal(true);
			return;
		}

		// Check if user can use the service
		if (!canUseService()) {
			setConversionState({
				status: 'error',
				error:
					'You have reached your free conversion limit. Please upgrade to continue.',
			});
			return;
		}

		setConversionState({ status: 'uploading', progress: 0 });

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('words_per_segment', settings.wordsPerSegment.toString());
			formData.append('frame_rate', settings.frameRate.toString());

			setConversionState({ status: 'converting', progress: 50 });

			// You can change this URL to your actual backend URL
			const backendUrl =
				process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

			// Get user token for authentication
			const token = await user.getIdToken();

			const response = await fetch(`${backendUrl}/api/convert`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ detail: 'Conversion failed' }));
				throw new Error(errorData.detail || `HTTP ${response.status}`);
			}

			// Check if the response is JSON (cancellation) or file download
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				const result = await response.json();
				if (result.status === 'cancelled') {
					throw new Error('Conversion was cancelled by a newer request');
				}
			}

			// Create blob from response for download
			const blob = await response.blob();
			const downloadUrl = URL.createObjectURL(blob);

			// Get filename from response headers or generate one
			const contentDisposition = response.headers.get('content-disposition');
			let filename = file.name.replace('.m4a', '.srt');
			if (contentDisposition) {
				const filenameMatch = contentDisposition.match(/filename="(.+)"/);
				if (filenameMatch) {
					filename = filenameMatch[1];
				}
			}

			setConversionState({
				status: 'success',
				progress: 100,
				downloadUrl,
				filename,
			});

			// Increment usage count
			await incrementUsage();
		} catch (error) {
			console.error('Conversion error:', error);
			setConversionState({
				status: 'error',
				error:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred',
			});
		}
	}, [file, settings, user, canUseService, incrementUsage]);

	const handleReset = useCallback(() => {
		setFile(null);
		setConversionState({ status: 'idle' });
		if (conversionState.downloadUrl) {
			URL.revokeObjectURL(conversionState.downloadUrl);
		}
	}, [conversionState.downloadUrl]);

	const isProcessing =
		conversionState.status === 'uploading' ||
		conversionState.status === 'converting';

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="flex justify-between items-center mb-4">
							<div className="flex-1"></div>
							<h1 className="text-4xl font-bold text-gray-900 dark:text-white">
								M4A to SRT Converter
							</h1>
							<div className="flex-1 flex justify-end">
								{user ? (
									<div className="flex items-center gap-4">
										<span className="text-sm text-gray-600 dark:text-gray-300">
											{userData?.isAdmin ? '👑 Admin' : `👋 ${user.email}`}
										</span>
										<button
											onClick={logout}
											className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
										>
											Sign Out
										</button>
									</div>
								) : (
									<button
										onClick={() => setShowAuthModal(true)}
										className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
									>
										Sign In
									</button>
								)}
							</div>
						</div>
						<p className="text-lg text-gray-600 dark:text-gray-300">
							Convert your M4A audio files to SRT subtitle files using AI
							transcription
						</p>
					</div>

					{/* Usage Status */}
					{user && <UsageStatus />}

					{/* Main Content */}
					<div
						className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 ${
							user ? 'mt-6' : ''
						}`}
					>
						{conversionState.status === 'idle' ||
						conversionState.status === 'error' ? (
							<>
								<FileUploader
									onFileSelect={handleFileSelect}
									selectedFile={file}
									disabled={isProcessing}
								/>

								{file && (
									<>
										<ConversionSettings
											settings={settings}
											onSettingsChange={setSettings}
											disabled={isProcessing}
										/>

										<div className="mt-6 flex justify-center">
											<button
												onClick={handleConvert}
												disabled={isProcessing}
												className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2"
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 12l2 2 4-4M7 20l4-16 9 1-4 15.5-3-1.5-1 3z"
													/>
												</svg>
												Convert to SRT
											</button>
										</div>
									</>
								)}

								{conversionState.status === 'error' && (
									<div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
										<div className="flex items-center gap-2 text-red-800 dark:text-red-300">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<span className="font-semibold">Error:</span>
											<span>{conversionState.error}</span>
										</div>
									</div>
								)}
							</>
						) : (
							<ConversionResult
								state={conversionState}
								onReset={handleReset}
								originalFilename={file?.name}
							/>
						)}
					</div>

					{/* Add link to this: "https://editingtools.io/subtitles/" */}

					<div className="mt-12 flex justify-center">
						<a
							href="https://editingtools.io/subtitles/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:text-blue-700"
						>
							Convert from SRT to any other subtitle type
						</a>
					</div>
				</div>
			</div>

			{/* Auth Modal */}
			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
			/>
		</div>
	);
}
