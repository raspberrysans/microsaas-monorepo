/** @format */

'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const UsageStatus: React.FC = () => {
	const { userData, canUseService } = useAuth();

	if (!userData || userData.isAdmin) return null;

	const remainingConversions =
		userData.maxFreeConversions - userData.conversionsUsed;
	const isAtLimit = !canUseService();

	return (
		<div
			className={`p-4 rounded-lg border ${
				isAtLimit
					? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
					: remainingConversions === 1
					? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
					: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
			}`}
		>
			<div className="flex items-center gap-2">
				<svg
					className={`w-5 h-5 ${
						isAtLimit
							? 'text-red-600 dark:text-red-400'
							: remainingConversions === 1
							? 'text-orange-600 dark:text-orange-400'
							: 'text-blue-600 dark:text-blue-400'
					}`}
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
				<div>
					<p
						className={`font-semibold ${
							isAtLimit
								? 'text-red-800 dark:text-red-300'
								: remainingConversions === 1
								? 'text-orange-800 dark:text-orange-300'
								: 'text-blue-800 dark:text-blue-300'
						}`}
					>
						{isAtLimit
							? 'Free conversions used up!'
							: `${remainingConversions} free conversion${
									remainingConversions !== 1 ? 's' : ''
							  } remaining`}
					</p>
					<p
						className={`text-sm ${
							isAtLimit
								? 'text-red-600 dark:text-red-400'
								: remainingConversions === 1
								? 'text-orange-600 dark:text-orange-400'
								: 'text-blue-600 dark:text-blue-400'
						}`}
					>
						{isAtLimit
							? 'Upgrade to continue using the service'
							: `You've used ${userData.conversionsUsed} out of ${userData.maxFreeConversions} free conversions`}
					</p>
				</div>
			</div>

			{isAtLimit && (
				<div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
					<button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
						Upgrade Now (Coming Soon)
					</button>
				</div>
			)}
		</div>
	);
};
