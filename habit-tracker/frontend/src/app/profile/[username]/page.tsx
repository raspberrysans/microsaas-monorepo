/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile, HabitCategory, Habit } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Star, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicProfilePage() {
	const params = useParams();
	const username = params.username as string;

	const [profile, setProfile] = useState<Profile | null>(null);
	const [categories, setCategories] = useState<HabitCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (username) {
			fetchPublicProfile();
		}
	}, [username]);

	const fetchPublicProfile = async () => {
		try {
			// Fetch profile by username
			const { data: profileData, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('username', username)
				.single();

			if (profileError) {
				if (profileError.code === 'PGRST116') {
					setError('Profile not found');
				} else {
					throw profileError;
				}
				return;
			}

			setProfile(profileData);

			// Fetch public categories and habits
			const { data: categoriesData, error: categoriesError } = await supabase
				.from('habit_categories')
				.select('*')
				.eq('user_id', profileData.user_id)
				.order('created_at', { ascending: true });

			if (categoriesError) throw categoriesError;

			// Fetch public habits for each category
			const categoriesWithHabits = await Promise.all(
				(categoriesData || []).map(async (category) => {
					const { data: habitsData, error: habitsError } = await supabase
						.from('habits')
						.select('*')
						.eq('category_id', category.id)
						.eq('is_public', true)
						.order('is_non_negotiable', { ascending: false })
						.order('priority', { ascending: false });

					if (habitsError) throw habitsError;

					return {
						...category,
						habits: habitsData || [],
					};
				})
			);

			// Filter out categories with no public habits
			const publicCategories = categoriesWithHabits.filter(
				(cat) => cat.habits && cat.habits.length > 0
			);

			setCategories(publicCategories);
		} catch (error) {
			console.error('Error fetching public profile:', error);
			setError('Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'high':
				return 'text-red-600 border-red-200';
			case 'medium':
				return 'text-yellow-600 border-yellow-200';
			case 'low':
				return 'text-green-600 border-green-200';
			default:
				return 'text-gray-600 border-gray-200';
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="animate-pulse text-lg">Loading profile...</div>
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						{error || 'Profile not found'}
					</h1>
					<p className="text-gray-600">
						The profile you're looking for doesn't exist or is not public.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Profile Header */}
				<Card className="mb-8">
					<CardContent className="p-6">
						<div className="flex items-start gap-4">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
								{profile.avatar_url ? (
									<img
										src={profile.avatar_url}
										alt={profile.display_name}
										className="w-16 h-16 rounded-full object-cover"
									/>
								) : (
									<User className="w-8 h-8 text-blue-600" />
								)}
							</div>
							<div className="flex-1">
								<h1 className="text-2xl font-bold text-gray-900 mb-1">
									{profile.display_name}
								</h1>
								<p className="text-gray-600 mb-2">@{profile.username}</p>
								{profile.bio && <p className="text-gray-700">{profile.bio}</p>}
								<div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
									<Calendar className="w-4 h-4" />
									<span>
										Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Public Habits */}
				<div className="mb-8">
					<h2 className="text-xl font-bold text-gray-900 mb-4">
						Public Habits
					</h2>
					<p className="text-gray-600 mb-6">
						These are the habits {profile.display_name} has chosen to share
						publicly.
					</p>
				</div>

				{categories.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center">
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No public habits yet
							</h3>
							<p className="text-gray-500">
								{profile.display_name} hasn't shared any habits publicly yet.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-6 md:grid-cols-2">
						{categories.map((category) => (
							<Card
								key={category.id}
								className="hover:shadow-md transition-shadow"
							>
								<CardHeader className="pb-3">
									<div className="flex items-center gap-3">
										<div
											className="w-4 h-4 rounded-full"
											style={{ backgroundColor: category.color }}
										/>
										<CardTitle className="text-lg">{category.name}</CardTitle>
									</div>
									{category.description && (
										<p className="text-sm text-gray-600">
											{category.description}
										</p>
									)}
								</CardHeader>
								<CardContent className="space-y-3">
									{category.habits?.map((habit) => (
										<div key={habit.id} className="p-3 bg-gray-50 rounded-lg">
											<div className="flex items-center justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<span className="text-sm font-medium text-gray-900">
															{habit.name}
														</span>
														{habit.is_non_negotiable && (
															<Star className="w-4 h-4 text-red-500 fill-current" />
														)}
													</div>
													{habit.description && (
														<p className="text-xs text-gray-500 mb-1">
															{habit.description}
														</p>
													)}
													<div className="flex items-center gap-2">
														<span
															className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
																habit.priority
															)}`}
														>
															{habit.priority} priority
														</span>
														<span className="text-xs text-gray-500">
															{habit.target_frequency}x {habit.frequency_unit}
														</span>
													</div>
												</div>
											</div>
										</div>
									))}
								</CardContent>
							</Card>
						))}
					</div>
				)}

				<div className="mt-8 text-center">
					<p className="text-sm text-gray-500">
						Want to track your own habits?{' '}
						<a href="/" className="text-blue-600 hover:underline">
							Get started with Habit Tracker
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}
