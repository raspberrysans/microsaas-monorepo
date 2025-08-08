/** @format */

'use client';

import React, { useState } from 'react';
import { Habit } from '@/types';
import { Button } from '@/components/ui/Button';
import {
	CheckCircle,
	Circle,
	Star,
	MoreVertical,
	Edit,
	Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, startOfDay } from 'date-fns';

interface HabitItemProps {
	habit: Habit;
	onUpdate: () => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ habit, onUpdate }) => {
	const { user } = useAuth();
	const [showMenu, setShowMenu] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [logging, setLogging] = useState(false);
	const [completedToday, setCompletedToday] = useState(false);

	React.useEffect(() => {
		checkTodayCompletion();
	}, [habit.id]);

	const checkTodayCompletion = async () => {
		if (!user) return;

		try {
			const today = startOfDay(new Date()).toISOString();
			const { data, error } = await supabase
				.from('habit_logs')
				.select('*')
				.eq('habit_id', habit.id)
				.eq('user_id', user.uid)
				.gte('completed_at', today)
				.limit(1);

			if (error) throw error;
			setCompletedToday(data && data.length > 0);
		} catch (error) {
			console.error('Error checking today completion:', error);
		}
	};

	const handleToggleComplete = async () => {
		if (!user) return;

		setLogging(true);
		try {
			if (completedToday) {
				// Remove today's log
				const today = startOfDay(new Date()).toISOString();
				const { error } = await supabase
					.from('habit_logs')
					.delete()
					.eq('habit_id', habit.id)
					.eq('user_id', user.uid)
					.gte('completed_at', today);

				if (error) throw error;
				setCompletedToday(false);
			} else {
				// Add today's log
				const { error } = await supabase.from('habit_logs').insert({
					habit_id: habit.id,
					user_id: user.uid,
					completed_at: new Date().toISOString(),
				});

				if (error) throw error;
				setCompletedToday(true);
			}
		} catch (error) {
			console.error('Error toggling habit completion:', error);
		} finally {
			setLogging(false);
		}
	};

	const handleDeleteHabit = async () => {
		if (!confirm('Are you sure you want to delete this habit?')) {
			return;
		}

		setDeleting(true);
		try {
			const { error } = await supabase
				.from('habits')
				.delete()
				.eq('id', habit.id);

			if (error) throw error;
			onUpdate();
		} catch (error) {
			console.error('Error deleting habit:', error);
		} finally {
			setDeleting(false);
			setShowMenu(false);
		}
	};

	const getPriorityColor = () => {
		switch (habit.priority) {
			case 'high':
				return 'text-red-600';
			case 'medium':
				return 'text-yellow-600';
			case 'low':
				return 'text-green-600';
			default:
				return 'text-gray-600';
		}
	};

	const getPriorityIcon = () => {
		if (habit.is_non_negotiable) {
			return <Star className="w-4 h-4 text-red-500 fill-current" />;
		}
		return null;
	};

	return (
		<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
			<div className="flex items-center gap-3 flex-1">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleToggleComplete}
					disabled={logging}
					className="h-6 w-6 p-0"
				>
					{completedToday ? (
						<CheckCircle className="w-5 h-5 text-green-600" />
					) : (
						<Circle className="w-5 h-5 text-gray-400" />
					)}
				</Button>

				<div className="flex-1">
					<div className="flex items-center gap-2">
						<span
							className={`text-sm font-medium ${
								completedToday ? 'line-through text-gray-500' : 'text-gray-900'
							}`}
						>
							{habit.name}
						</span>
						{getPriorityIcon()}
						<span
							className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor()}`}
						>
							{habit.priority}
						</span>
					</div>
					{habit.description && (
						<p className="text-xs text-gray-500 mt-1">{habit.description}</p>
					)}
					<p className="text-xs text-gray-400">
						{habit.target_frequency}x {habit.frequency_unit}
					</p>
				</div>
			</div>

			<div className="relative">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowMenu(!showMenu)}
					className="h-6 w-6 p-0"
				>
					<MoreVertical className="w-4 h-4" />
				</Button>
				{showMenu && (
					<div className="absolute right-0 top-6 z-10 bg-white border rounded-md shadow-lg py-1 min-w-[100px]">
						<button
							className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
							onClick={() => {
								// TODO: Implement edit habit
								setShowMenu(false);
							}}
						>
							<Edit className="w-4 h-4" />
							Edit
						</button>
						<button
							className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
							onClick={handleDeleteHabit}
							disabled={deleting}
						>
							<Trash2 className="w-4 h-4" />
							{deleting ? 'Deleting...' : 'Delete'}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
