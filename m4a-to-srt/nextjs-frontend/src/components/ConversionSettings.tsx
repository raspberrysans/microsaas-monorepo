/** @format */

'use client';

import { useCallback } from 'react';

interface ConversionSettingsProps {
	settings: {
		wordsPerSegment: number;
		frameRate: number;
		useNaturalSegmentation: boolean;
	};
	onSettingsChange: (settings: {
		wordsPerSegment: number;
		frameRate: number;
		useNaturalSegmentation: boolean;
	}) => void;
	disabled?: boolean;
}

export function ConversionSettings({
	settings,
	onSettingsChange,
	disabled,
}: ConversionSettingsProps) {
	const handleWordsPerSegmentChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = parseInt(e.target.value, 10);
			if (value >= 1 && value <= 50) {
				onSettingsChange({
					...settings,
					wordsPerSegment: value,
				});
			}
		},
		[settings, onSettingsChange]
	);

	const handleFrameRateChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = parseFloat(e.target.value);
			if (value > 0 && value <= 120) {
				onSettingsChange({
					...settings,
					frameRate: value,
				});
			}
		},
		[settings, onSettingsChange]
	);

	const handleNaturalSegmentationChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onSettingsChange({
				...settings,
				useNaturalSegmentation: e.target.checked,
			});
		},
		[settings, onSettingsChange]
	);

	return (
		<div className="mt-8 space-y-6">
			<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
				Conversion Settings
			</h3>

			{/* Natural Segmentation Option */}
			<div className="space-y-2">
				<div className="flex items-center space-x-3">
					<input
						id="natural-segmentation"
						type="checkbox"
						checked={settings.useNaturalSegmentation}
						onChange={handleNaturalSegmentationChange}
						disabled={disabled}
						className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					<label
						htmlFor="natural-segmentation"
						className="text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Use Natural Segmentation
					</label>
				</div>
				<p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
					Let Whisper create natural sentence breaks instead of fixed word
					counts. This creates more natural-sounding subtitles but may result in
					longer segments.
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				{/* Words per Segment */}
				<div
					className={`space-y-2 ${
						settings.useNaturalSegmentation ? 'opacity-50' : ''
					}`}
				>
					<label
						htmlFor="words-per-segment"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Words per Segment
					</label>
					<div className="relative">
						<input
							id="words-per-segment"
							type="number"
							min="1"
							max="50"
							value={settings.wordsPerSegment}
							onChange={handleWordsPerSegmentChange}
							disabled={disabled || settings.useNaturalSegmentation}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-600"
						/>
						<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
							<span className="text-gray-500 dark:text-gray-400 text-sm">
								words
							</span>
						</div>
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						{settings.useNaturalSegmentation
							? 'Disabled when using natural segmentation'
							: 'Number of words to include in each subtitle segment (1-50). Fewer words create more segments with shorter duration.'}
					</p>
				</div>

				{/* Frame Rate */}
				<div className="space-y-2">
					<label
						htmlFor="frame-rate"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Frame Rate
					</label>
					<div className="relative">
						<input
							id="frame-rate"
							type="number"
							min="1"
							max="120"
							step="0.1"
							value={settings.frameRate}
							onChange={handleFrameRateChange}
							disabled={disabled}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-600"
						/>
						<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
							<span className="text-gray-500 dark:text-gray-400 text-sm">
								fps
							</span>
						</div>
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						Frame rate for timing calculations (1-120 fps). Common values: 24,
						25, 30, 60.
					</p>
				</div>
			</div>

			{/* Preset Buttons */}
			<div className="space-y-3">
				<h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
					Quick Presets
				</h4>
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() =>
							onSettingsChange({
								...settings,
								useNaturalSegmentation: true,
								frameRate: 30.0,
							})
						}
						disabled={disabled}
						className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Natural Segmentation
					</button>
					<button
						onClick={() =>
							onSettingsChange({
								...settings,
								wordsPerSegment: 6,
								frameRate: 30.0,
								useNaturalSegmentation: false,
							})
						}
						disabled={disabled}
						className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Short segments (6 words)
					</button>
					<button
						onClick={() =>
							onSettingsChange({
								...settings,
								wordsPerSegment: 8,
								frameRate: 30.0,
								useNaturalSegmentation: false,
							})
						}
						disabled={disabled}
						className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Default (8 words)
					</button>
					<button
						onClick={() =>
							onSettingsChange({
								...settings,
								wordsPerSegment: 12,
								frameRate: 30.0,
								useNaturalSegmentation: false,
							})
						}
						disabled={disabled}
						className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Long segments (12 words)
					</button>
					<button
						onClick={() =>
							onSettingsChange({
								...settings,
								frameRate: 24.0,
							})
						}
						disabled={disabled}
						className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						24 fps (Cinema)
					</button>
					<button
						onClick={() =>
							onSettingsChange({
								...settings,
								frameRate: 25.0,
							})
						}
						disabled={disabled}
						className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						25 fps (PAL)
					</button>
					<button
						onClick={() =>
							onSettingsChange({
								...settings,
								frameRate: 60.0,
							})
						}
						disabled={disabled}
						className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						60 fps (High framerate)
					</button>
				</div>
			</div>

			{/* Settings Preview */}
			<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
				<h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Current Settings
				</h4>
				<div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
					{settings.useNaturalSegmentation ? (
						<>
							<p>
								• Using <strong>natural segmentation</strong> - Whisper will
								create natural sentence breaks
							</p>
							<p>
								• Timing calculations will use{' '}
								<strong>{settings.frameRate}</strong> frames per second
							</p>
							<p>
								• Subtitle duration will vary based on natural speech patterns
							</p>
						</>
					) : (
						<>
							<p>
								• Each subtitle will contain up to{' '}
								<strong>{settings.wordsPerSegment}</strong> words
							</p>
							<p>
								• Timing calculations will use{' '}
								<strong>{settings.frameRate}</strong> frames per second
							</p>
							<p>
								• Estimated subtitle duration:{' '}
								<strong>
									{(settings.wordsPerSegment * 0.5).toFixed(1)}-
									{(settings.wordsPerSegment * 0.8).toFixed(1)} seconds
								</strong>{' '}
								per segment
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
