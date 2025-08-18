/** @format */

'use client';

import { useCallback } from 'react';

interface FileUploaderProps {
	onFileSelect: (file: File) => void;
	selectedFile: File | null;
	disabled?: boolean;
}

export function FileUploader({
	onFileSelect,
	selectedFile,
	disabled,
}: FileUploaderProps) {
	const handleFileChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) {
				// Validate file type
				if (!file.name.toLowerCase().endsWith('.m4a')) {
					alert('Please select an M4A file.');
					return;
				}

				// Validate file size (max 100MB)
				const maxSize = 100 * 1024 * 1024; // 100MB
				if (file.size > maxSize) {
					alert('File size must be less than 100MB.');
					return;
				}

				onFileSelect(file);
			}
		},
		[onFileSelect]
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const files = e.dataTransfer.files;
			const file = files[0];

			if (file) {
				// Validate file type
				if (!file.name.toLowerCase().endsWith('.m4a')) {
					alert('Please select an M4A file.');
					return;
				}

				// Validate file size (max 100MB)
				const maxSize = 100 * 1024 * 1024; // 100MB
				if (file.size > maxSize) {
					alert('File size must be less than 100MB.');
					return;
				}

				onFileSelect(file);
			}
		},
		[onFileSelect]
	);

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	return (
		<div className="w-full">
			<label
				htmlFor="file-upload"
				className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
			>
				Select M4A Audio File
			</label>

			<div
				className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
					disabled
						? 'border-gray-300 bg-gray-50 cursor-not-allowed'
						: 'border-gray-300 hover:border-blue-400 cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-blue-500'
				}`}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<input
					id="file-upload"
					type="file"
					accept=".m4a"
					onChange={handleFileChange}
					disabled={disabled}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
				/>

				<div className="space-y-4">
					<div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
						<svg
							className="w-8 h-8 text-blue-600 dark:text-blue-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>

					{selectedFile ? (
						<div className="space-y-2">
							<p className="text-lg font-medium text-gray-900 dark:text-white">
								{selectedFile.name}
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{formatFileSize(selectedFile.size)}
							</p>
							<div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
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
										d="M5 13l4 4L19 7"
									/>
								</svg>
								File selected
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<p className="text-lg font-medium text-gray-900 dark:text-white">
								Drop your M4A file here, or click to browse
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Maximum file size: 100MB
							</p>
						</div>
					)}
				</div>
			</div>

			{selectedFile && (
				<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0">
							<svg
								className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div className="text-sm text-blue-800 dark:text-blue-300">
							<p className="font-medium mb-1">Ready to convert</p>
							<p>
								Your M4A file will be processed using AI transcription to
								generate accurate SRT subtitles.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
