/** @format */

'use client';

import { useCallback } from 'react';

interface SrtPreviewProps {
	srtContent: string;
	filename: string;
	onDownload: () => void;
	onReset: () => void;
}

export function SrtPreview({
	srtContent,
	filename,
	onDownload,
	onReset,
}: SrtPreviewProps) {
	const handleCopyToClipboard = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(srtContent);
			// You might want to add a toast notification here
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	}, [srtContent]);

	// Parse SRT content to display in a more readable format
	const parseSrtContent = useCallback(() => {
		const lines = srtContent.split('\n');
		const subtitles = [];
		let currentSubtitle = null;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();

			if (!line) {
				if (currentSubtitle) {
					subtitles.push(currentSubtitle);
					currentSubtitle = null;
				}
				continue;
			}

			if (!currentSubtitle) {
				// This should be the subtitle number
				currentSubtitle = {
					number: parseInt(line),
					timestamp: '',
					text: '',
				};
			} else if (!currentSubtitle.timestamp) {
				// This should be the timestamp
				currentSubtitle.timestamp = line;
			} else {
				// This should be the text (might be multiple lines)
				if (currentSubtitle.text) {
					currentSubtitle.text += '\n' + line;
				} else {
					currentSubtitle.text = line;
				}
			}
		}

		// Add the last subtitle if exists
		if (currentSubtitle) {
			subtitles.push(currentSubtitle);
		}

		return subtitles;
	}, [srtContent]);

	const subtitles = parseSrtContent();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="text-center space-y-2">
				<div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
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
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					Conversion Complete!
				</h2>
				<p className="text-gray-600 dark:text-gray-300">
					Review your subtitles below and download when ready.
				</p>
			</div>

			{/* File Info */}
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
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					<span className="font-medium">
						{filename} • {subtitles.length} subtitles
					</span>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex flex-col sm:flex-row gap-4 justify-center">
				<button
					onClick={onDownload}
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
					onClick={handleCopyToClipboard}
					className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					Copy to Clipboard
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

			{/* SRT Preview */}
			<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
				<div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
						Subtitle Preview
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Review your subtitles before downloading
					</p>
				</div>

				<div className="max-h-96 overflow-y-auto p-4 space-y-4">
					{subtitles.map((subtitle, index) => (
						<div
							key={index}
							className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-r-lg"
						>
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
									#{subtitle.number}
								</span>
								<span className="text-xs font-mono text-gray-600 dark:text-gray-400">
									{subtitle.timestamp}
								</span>
							</div>
							<p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
								{subtitle.text}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Raw SRT Content (Collapsible) */}
			<details className="bg-gray-50 dark:bg-gray-700 rounded-lg">
				<summary className="cursor-pointer p-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
					View Raw SRT Content
				</summary>
				<div className="p-4 pt-0">
					<pre className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-white">
						{srtContent}
					</pre>
				</div>
			</details>
		</div>
	);
}
