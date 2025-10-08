/** @format */

'use client';

import { useCallback } from 'react';

interface ConversionState {
	status: 'idle' | 'uploading' | 'converting' | 'success' | 'preview' | 'error';
	progress?: number;
	error?: string;
	downloadUrl?: string;
	filename?: string;
}

interface ConversionResultProps {
	state: ConversionState;
	onReset: () => void;
	originalFilename?: string;
}

export function ConversionResult({
	state,
	onReset,
	originalFilename,
}: ConversionResultProps) {
	const handleDownload = useCallback(() => {
		if (state.downloadUrl && state.filename) {
			const link = document.createElement('a');
			link.href = state.downloadUrl;
			link.download = state.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}, [state.downloadUrl, state.filename]);

	const getStatusIcon = () => {
		switch (state.status) {
			case 'uploading':
				return (
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				);
			case 'converting':
				return (
					<div className="relative w-12 h-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
						<div className="absolute inset-0 flex items-center justify-center">
							<svg
								className="w-6 h-6 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
								/>
							</svg>
						</div>
					</div>
				);
			case 'success':
				return (
					<div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
						<svg
							className="w-6 h-6 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
				);
			default:
				return null;
		}
	};

	const getStatusMessage = () => {
		switch (state.status) {
			case 'uploading':
				return 'Uploading file...';
			case 'converting':
				return 'Converting audio to subtitles...';
			case 'success':
				return 'Conversion completed successfully!';
			default:
				return '';
		}
	};

	const getStatusDescription = () => {
		switch (state.status) {
			case 'uploading':
				return 'Your file is being uploaded to the server.';
			case 'converting':
				return 'AI is transcribing your audio and generating subtitles. This may take a few minutes depending on the file size.';
			case 'success':
				return 'Your SRT subtitle file is ready for download.';
			default:
				return '';
		}
	};

	return (
		<div className="text-center space-y-6">
			{/* Status Icon */}
			<div className="flex justify-center">{getStatusIcon()}</div>

			{/* Status Message */}
			<div className="space-y-2">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					{getStatusMessage()}
				</h2>
				<p className="text-gray-600 dark:text-gray-300">
					{getStatusDescription()}
				</p>
			</div>

			{/* Progress Bar (for uploading/converting) */}
			{(state.status === 'uploading' || state.status === 'converting') && (
				<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
					<div
						className="bg-blue-600 h-2 rounded-full transition-all duration-300"
						style={{ width: `${state.progress || 0}%` }}
					></div>
				</div>
			)}

			{/* File Information */}
			{originalFilename && (
				<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
					<div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<span>Processing: {originalFilename}</span>
					</div>
				</div>
			)}

			{/* Success Actions */}
			{state.status === 'success' && (
				<div className="space-y-4">
					<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
						<div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-300">
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
									d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
								/>
							</svg>
							<span className="font-medium">
								{state.filename ? `File: ${state.filename}` : 'SRT file ready'}
							</span>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							onClick={handleDownload}
							className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
									d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z"
								/>
							</svg>
							Download SRT File
						</button>

						<button
							onClick={onReset}
							className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Convert Another File
						</button>
					</div>
				</div>
			)}

			{/* Processing Info */}
			{state.status === 'converting' && (
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
						<p className="font-medium">What&apos;s happening:</p>
						<ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
							<li>Converting M4A to WAV format</li>
							<li>Running AI transcription with Whisper</li>
							<li>Extracting word-level timestamps</li>
							<li>Generating SRT subtitle format</li>
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
