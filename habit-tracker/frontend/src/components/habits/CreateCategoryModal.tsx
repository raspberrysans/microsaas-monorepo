/** @format */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X } from 'lucide-react';

interface CreateCategoryModalProps {
	onClose: () => void;
	onCategoryCreated: () => void;
}

const PRESET_COLORS = [
	'#3B82F6', // Blue
	'#10B981', // Green
	'#F59E0B', // Amber
	'#EF4444', // Red
	'#8B5CF6', // Purple
	'#06B6D4', // Cyan
	'#F97316', // Orange
	'#84CC16', // Lime
	'#EC4899', // Pink
	'#6B7280', // Gray
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
	onClose,
	onCategoryCreated,
}) => {
	const { user } = useAuth();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user || !name.trim()) return;

		setLoading(true);
		setError('');

		try {
			const { error } = await supabase.from('habit_categories').insert({
				user_id: user.uid,
				name: name.trim(),
				description: description.trim() || null,
				color: selectedColor,
			});

			if (error) throw error;

			onCategoryCreated();
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Create New Category</CardTitle>
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
								Category Name
							</label>
							<Input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Health, Productivity, Personal Growth"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Description (optional)
							</label>
							<Input
								type="text"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description of this category"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Color
							</label>
							<div className="grid grid-cols-5 gap-2">
								{PRESET_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										className={`w-8 h-8 rounded-full border-2 ${
											selectedColor === color
												? 'border-gray-900 scale-110'
												: 'border-gray-300'
										} transition-all`}
										style={{ backgroundColor: color }}
										onClick={() => setSelectedColor(color)}
									/>
								))}
							</div>
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
								disabled={loading || !name.trim()}
								className="flex-1"
							>
								{loading ? 'Creating...' : 'Create Category'}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};
