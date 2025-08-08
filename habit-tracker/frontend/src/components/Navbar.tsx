/** @format */

'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
	const { user, logout } = useAuth();

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error('Error logging out:', error);
		}
	};

	return (
		<nav className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center">
						<Link
							href="/"
							className="text-xl font-bold text-gray-900 hover:text-gray-700"
						>
							Habit Tracker
						</Link>
					</div>

					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-2 text-sm text-gray-600">
							<User className="w-4 h-4" />
							<span>{user?.email}</span>
						</div>
						<Link href="/settings">
							<Button
								variant="outline"
								size="sm"
								className="flex items-center gap-2"
							>
								<Settings className="w-4 h-4" />
								Settings
							</Button>
						</Link>
						<Button
							onClick={handleLogout}
							variant="outline"
							size="sm"
							className="flex items-center gap-2"
						>
							<LogOut className="w-4 h-4" />
							Logout
						</Button>
					</div>
				</div>
			</div>
		</nav>
	);
};
