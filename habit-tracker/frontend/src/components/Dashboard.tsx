/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { HabitCategory, Habit } from '@/types';
import { Button } from '@/components/ui/Button';
import { HabitCategoryCard } from '@/components/habits/HabitCategoryCard';
import { CreateCategoryModal } from '@/components/habits/CreateCategoryModal';
import { Navbar } from '@/components/Navbar';
import { Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
	const { user } = useAuth();
	const [categories, setCategories] = useState<HabitCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreateCategory, setShowCreateCategory] = useState(false);

	useEffect(() => {
		if (user) {
			fetchCategories();
		}
	}, [user]);

	const fetchCategories = async () => {
		try {
			const { data: categoriesData, error: categoriesError } = await supabase
				.from('habit_categories')
				.select('*')
				.eq('user_id', user?.uid)
				.order('created_at', { ascending: true });

			if (categoriesError) throw categoriesError;

			// Fetch habits for each category
			const categoriesWithHabits = await Promise.all(
				(categoriesData || []).map(async (category) => {
					const { data: habitsData, error: habitsError } = await supabase
						.from('habits')
						.select('*')
						.eq('category_id', category.id)
						.order('is_non_negotiable', { ascending: false })
						.order('priority', { ascending: false });

					if (habitsError) throw habitsError;

					return {
						...category,
						habits: habitsData || [],
					};
				})
			);

			setCategories(categoriesWithHabits);
		} catch (error) {
			console.error('Error fetching categories:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleCategoryCreated = () => {
		setShowCreateCategory(false);
		fetchCategories();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-pulse text-lg">Loading your habits...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Your Habits</h1>
					<p className="text-gray-600">
						Track your daily, weekly, and monthly habits organized by categories
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{categories.map((category) => (
						<HabitCategoryCard
							key={category.id}
							category={category}
							onUpdate={fetchCategories}
						/>
					))}

					<div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-gray-400 transition-colors">
						<Button
							onClick={() => setShowCreateCategory(true)}
							variant="outline"
							className="flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							Add Category
						</Button>
						<p className="text-sm text-gray-500 mt-2 text-center">
							Create a new category to organize your habits
						</p>
					</div>
				</div>

				{categories.length === 0 && (
					<div className="text-center py-12">
						<div className="max-w-md mx-auto">
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No categories yet
							</h3>
							<p className="text-gray-500 mb-6">
								Start by creating your first habit category. You can organize
								habits by themes like Health, Productivity, or Personal Growth.
							</p>
							<Button onClick={() => setShowCreateCategory(true)}>
								<Plus className="w-4 h-4 mr-2" />
								Create Your First Category
							</Button>
						</div>
					</div>
				)}
			</main>

			{showCreateCategory && (
				<CreateCategoryModal
					onClose={() => setShowCreateCategory(false)}
					onCategoryCreated={handleCategoryCreated}
				/>
			)}
		</div>
	);
};
