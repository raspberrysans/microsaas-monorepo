/** @format */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X } from 'lucide-react';

interface CreateHabitModalProps {
	categoryId: string;
	onClose: () => void;
	onHabitCreated: () => void;
}

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
	categoryId,
	onClose,
	onHabitCreated,
}) => {
	const { user } = useAuth();
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		priority: 'medium' as 'low' | 'medium' | 'high',
		is_non_negotiable: false,
		target_frequency: 1,
		frequency_unit: 'daily' as 'daily' | 'weekly' | 'monthly',
		is_public: false,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user || !formData.name.trim()) return;

		setLoading(true);
		setError('');

		try {
			const { error } = await supabase.from('habits').insert({
				user_id: user.uid,
				category_id: categoryId,
				name: formData.name.trim(),
				description: formData.description.trim() || null,
				priority: formData.priority,
				is_non_negotiable: formData.is_non_negotiable,
				target_frequency: formData.target_frequency,
				frequency_unit: formData.frequency_unit,
				is_public: formData.is_public,
			});

			if (error) throw error;

			onHabitCreated();
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Create New Habit</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-8 w-8 p-0"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Habit Name
							</label>
							<Input
								type="text"
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder="e.g., Drink 8 glasses of water"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Description (optional)
							</label>
							<Input
								type="text"
								value={formData.description}
								onChange={(e) =>
									handleInputChange('description', e.target.value)
								}
								placeholder="Brief description or notes"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Priority
							</label>
							<div className="grid grid-cols-3 gap-2">
								{['low', 'medium', 'high'].map((priority) => (
									<button
										key={priority}
										type="button"
										className={`px-3 py-2 text-sm rounded-md border ${
											formData.priority === priority
												? 'bg-blue-50 border-blue-300 text-blue-700'
												: 'bg-white border-gray-300 text-gray-700'
										} hover:bg-gray-50 transition-colors`}
										onClick={() => handleInputChange('priority', priority)}
									>
										{priority.charAt(0).toUpperCase() + priority.slice(1)}
									</button>
								))}
							</div>
						</div>

						<div>
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={formData.is_non_negotiable}
									onChange={(e) =>
										handleInputChange('is_non_negotiable', e.target.checked)
									}
									className="rounded border-gray-300"
								/>
								<span className="text-sm font-medium text-gray-700">
									Non-negotiable habit
								</span>
							</label>
							<p className="text-xs text-gray-500 mt-1">
								Mark as non-negotiable if this is a must-do habit
							</p>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Frequency
								</label>
								<Input
									type="number"
									min="1"
									value={formData.target_frequency}
									onChange={(e) =>
										handleInputChange(
											'target_frequency',
											parseInt(e.target.value)
										)
									}
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Per
								</label>
								<select
									value={formData.frequency_unit}
									onChange={(e) =>
										handleInputChange('frequency_unit', e.target.value)
									}
									className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="daily">Day</option>
									<option value="weekly">Week</option>
									<option value="monthly">Month</option>
								</select>
							</div>
						</div>

						<div>
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={formData.is_public}
									onChange={(e) =>
										handleInputChange('is_public', e.target.checked)
									}
									className="rounded border-gray-300"
								/>
								<span className="text-sm font-medium text-gray-700">
									Show in public profile
								</span>
							</label>
							<p className="text-xs text-gray-500 mt-1">
								Allow others to see this habit in your public profile
							</p>
						</div>

						{error && <div className="text-red-500 text-sm">{error}</div>}

						<div className="flex gap-3 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={loading || !formData.name.trim()}
								className="flex-1"
							>
								{loading ? 'Creating...' : 'Create Habit'}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};
