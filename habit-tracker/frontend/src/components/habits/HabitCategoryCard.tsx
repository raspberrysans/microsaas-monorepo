/** @format */

'use client';

import React, { useState } from 'react';
import { HabitCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HabitItem } from './HabitItem';
import { CreateHabitModal } from './CreateHabitModal';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HabitCategoryCardProps {
	category: HabitCategory;
	onUpdate: () => void;
}

export const HabitCategoryCard: React.FC<HabitCategoryCardProps> = ({
	category,
	onUpdate,
}) => {
	const [showCreateHabit, setShowCreateHabit] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleDeleteCategory = async () => {
		if (
			!confirm(
				'Are you sure you want to delete this category and all its habits?'
			)
		) {
			return;
		}

		setDeleting(true);
		try {
			const { error } = await supabase
				.from('habit_categories')
				.delete()
				.eq('id', category.id);

			if (error) throw error;
			onUpdate();
		} catch (error) {
			console.error('Error deleting category:', error);
		} finally {
			setDeleting(false);
			setShowMenu(false);
		}
	};

	const handleHabitCreated = () => {
		setShowCreateHabit(false);
		onUpdate();
	};

	const nonNegotiableHabits =
		category.habits?.filter((h) => h.is_non_negotiable) || [];
	const regularHabits =
		category.habits?.filter((h) => !h.is_non_negotiable) || [];

	return (
		<>
			<Card className="hover:shadow-md transition-shadow">
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div
								className="w-4 h-4 rounded-full"
								style={{ backgroundColor: category.color }}
							/>
							<CardTitle className="text-lg">{category.name}</CardTitle>
						</div>
						<div className="relative">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowMenu(!showMenu)}
								className="h-8 w-8 p-0"
							>
								<MoreVertical className="w-4 h-4" />
							</Button>
							{showMenu && (
								<div className="absolute right-0 top-8 z-10 bg-white border rounded-md shadow-lg py-1 min-w-[120px]">
									<button
										className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
										onClick={() => {
											// TODO: Implement edit category
											setShowMenu(false);
										}}
									>
										<Edit className="w-4 h-4" />
										Edit
									</button>
									<button
										className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
										onClick={handleDeleteCategory}
										disabled={deleting}
									>
										<Trash2 className="w-4 h-4" />
										{deleting ? 'Deleting...' : 'Delete'}
									</button>
								</div>
							)}
						</div>
					</div>
					{category.description && (
						<p className="text-sm text-gray-600">{category.description}</p>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					{nonNegotiableHabits.length > 0 && (
						<div>
							<h4 className="text-sm font-medium text-red-600 mb-2">
								Non-Negotiables
							</h4>
							<div className="space-y-2">
								{nonNegotiableHabits.map((habit) => (
									<HabitItem key={habit.id} habit={habit} onUpdate={onUpdate} />
								))}
							</div>
						</div>
					)}

					{regularHabits.length > 0 && (
						<div>
							{nonNegotiableHabits.length > 0 && (
								<h4 className="text-sm font-medium text-gray-700 mb-2">
									Regular Habits
								</h4>
							)}
							<div className="space-y-2">
								{regularHabits.map((habit) => (
									<HabitItem key={habit.id} habit={habit} onUpdate={onUpdate} />
								))}
							</div>
						</div>
					)}

					{(!category.habits || category.habits.length === 0) && (
						<p className="text-sm text-gray-500 text-center py-4">
							No habits yet. Add your first habit!
						</p>
					)}

					<Button
						onClick={() => setShowCreateHabit(true)}
						variant="outline"
						size="sm"
						className="w-full flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						Add Habit
					</Button>
				</CardContent>
			</Card>

			{showCreateHabit && (
				<CreateHabitModal
					categoryId={category.id}
					onClose={() => setShowCreateHabit(false)}
					onHabitCreated={handleHabitCreated}
				/>
			)}
		</>
	);
};
