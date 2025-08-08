/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Navbar } from '@/components/Navbar';
import { Copy, Eye, Save, User } from 'lucide-react';

export default function SettingsPage() {
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [formData, setFormData] = useState({
		username: '',
		display_name: '',
		bio: '',
		public_url: '',
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	useEffect(() => {
		if (user) {
			fetchProfile();
		}
	}, [user]);

	const fetchProfile = async () => {
		if (!user) return;

		try {
			const { data, error } = await supabase
				.from('profiles')
				.select('*')
				.eq('user_id', user.uid)
				.single();

			if (error && error.code !== 'PGRST116') {
				throw error;
			}

			if (data) {
				setProfile(data);
				setFormData({
					username: data.username || '',
					display_name: data.display_name || '',
					bio: data.bio || '',
					public_url: data.public_url || '',
				});
			} else {
				// Create initial profile
				const initialProfile = {
					username: user.email?.split('@')[0] || '',
					display_name: user.displayName || user.email?.split('@')[0] || '',
					bio: '',
					public_url: '',
				};
				setFormData(initialProfile);
			}
		} catch (error) {
			console.error('Error fetching profile:', error);
			setError('Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const generatePublicUrl = () => {
		const randomId = Math.random().toString(36).substring(2, 8);
		const baseUrl = formData.username || user?.email?.split('@')[0] || 'user';
		setFormData((prev) => ({ ...prev, public_url: `${baseUrl}-${randomId}` }));
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		setSaving(true);
		setError('');
		setSuccess('');

		try {
			const profileData = {
				user_id: user.uid,
				username: formData.username.trim(),
				display_name: formData.display_name.trim(),
				bio: formData.bio.trim() || null,
				public_url: formData.public_url.trim() || null,
			};

			if (profile) {
				// Update existing profile
				const { error } = await supabase
					.from('profiles')
					.update(profileData)
					.eq('id', profile.id);

				if (error) throw error;
			} else {
				// Create new profile
				const { error } = await supabase.from('profiles').insert(profileData);

				if (error) throw error;
			}

			setSuccess('Profile saved successfully!');
			fetchProfile(); // Refresh profile data
		} catch (error: any) {
			setError(error.message);
		} finally {
			setSaving(false);
		}
	};

	const copyPublicUrl = () => {
		if (formData.public_url) {
			const fullUrl = `${window.location.origin}/profile/${formData.public_url}`;
			navigator.clipboard.writeText(fullUrl);
			setSuccess('Public URL copied to clipboard!');
			setTimeout(() => setSuccess(''), 3000);
		}
	};

	const viewPublicProfile = () => {
		if (formData.public_url) {
			window.open(`/profile/${formData.public_url}`, '_blank');
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Navbar />
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="animate-pulse text-lg">Loading settings...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
					<p className="text-gray-600">
						Manage your profile and public sharing preferences
					</p>
				</div>

				<form onSubmit={handleSave} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Profile Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Username
								</label>
								<Input
									type="text"
									value={formData.username}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											username: e.target.value,
										}))
									}
									placeholder="Your unique username"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Display Name
								</label>
								<Input
									type="text"
									value={formData.display_name}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											display_name: e.target.value,
										}))
									}
									placeholder="Your public display name"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Bio (optional)
								</label>
								<Input
									type="text"
									value={formData.bio}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, bio: e.target.value }))
									}
									placeholder="Tell others about yourself"
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Public Profile</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Public URL (optional)
								</label>
								<div className="flex gap-2">
									<Input
										type="text"
										value={formData.public_url}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												public_url: e.target.value,
											}))
										}
										placeholder="your-custom-url"
									/>
									<Button
										type="button"
										variant="outline"
										onClick={generatePublicUrl}
									>
										Generate
									</Button>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									This creates a public URL where others can view your shared
									habits
								</p>
								{formData.public_url && (
									<div className="mt-2 p-3 bg-gray-50 rounded-md">
										<p className="text-sm text-gray-700 mb-2">
											Your public profile will be available at:
										</p>
										<div className="flex items-center gap-2">
											<code className="text-sm bg-white px-2 py-1 rounded border flex-1">
												{typeof window !== 'undefined' &&
													`${window.location.origin}/profile/${formData.public_url}`}
											</code>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={copyPublicUrl}
											>
												<Copy className="w-4 h-4" />
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={viewPublicProfile}
											>
												<Eye className="w-4 h-4" />
											</Button>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{error && (
						<div className="text-red-500 text-sm p-4 bg-red-50 rounded-md">
							{error}
						</div>
					)}

					{success && (
						<div className="text-green-500 text-sm p-4 bg-green-50 rounded-md">
							{success}
						</div>
					)}

					<div className="flex justify-end">
						<Button type="submit" disabled={saving}>
							<Save className="w-4 h-4 mr-2" />
							{saving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
