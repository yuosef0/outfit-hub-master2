'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function DebugAuthPage() {
 const [authUser, setAuthUser] = useState<any>(null);
 const [dbUser, setDbUser] = useState<any>(null);
 const [store, setStore] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const supabase = useMemo(
 () =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 ),
 []
 );

 useEffect(() => {
 const fetchData = async () => {
 try {
 setLoading(true);

 // Get auth user
 const { data: { user }, error: authError } = await supabase.auth.getUser();

 if (authError) {
 setError('Auth Error: ' + authError.message);
 return;
 }

 setAuthUser(user);

 if (user) {
 // Get user from database
 const { data: userData, error: userError } = await supabase
 .from('users')
 .select('*')
 .eq('id', user.id)
 .maybeSingle();

 if (userError) {
 setError('User DB Error: ' + userError.message);
 } else {
 setDbUser(userData);
 }

 // Get store if merchant
 const { data: storeData, error: storeError } = await supabase
 .from('stores')
 .select('*')
 .eq('merchant_id', user.id)
 .maybeSingle();

 if (storeError) {
 console.log('Store Error:', storeError);
 } else {
 setStore(storeData);
 }
 }
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 fetchData();
 }, [supabase]);

 const updateRole = async (newRole: string) => {
 if (!authUser) return;

 try {
 const { error } = await supabase
 .from('users')
 .update({ role: newRole })
 .eq('id', authUser.id);

 if (error) {
 alert('Error updating role: ' + error.message);
 } else {
 alert('Role updated to: ' + newRole);
 window.location.reload();
 }
 } catch (err: any) {
 alert('Error: ' + err.message);
 }
 };

 const logout = async () => {
 await supabase.auth.signOut();
 window.location.href = '/login';
 };

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-background-light ">
 <div className="text-xl">Loading...</div>
 </div>
 );
 }

 return (
 <div className="min-h-screen p-8 bg-background-light text-text-light-primary">
 <div className="max-w-4xl mx-auto">
 <h1 className="text-3xl font-bold mb-8">🔧 Auth Debug Page</h1>

 {error && (
 <div className="bg-red-900 border border-red-400 text-red-300 px-4 py-3 rounded mb-6">
 <strong>Error:</strong> {error}
 </div>
 )}

 {/* Auth User Section */}
 <div className="bg-card-light rounded-lg shadow p-6 mb-6">
 <h2 className="text-xl font-semibold mb-4 text-primary">
 🔐 Auth User (Supabase Auth)
 </h2>
 {authUser ? (
 <div className="space-y-2 font-mono text-sm">
 <p><strong>ID:</strong> {authUser.id}</p>
 <p><strong>Email:</strong> {authUser.email}</p>
 <p><strong>Meta Role:</strong> {authUser.user_metadata?.role || 'N/A'}</p>
 <p><strong>Created:</strong> {authUser.created_at}</p>
 </div>
 ) : (
 <p className="text-red-500">Not authenticated</p>
 )}
 </div>

 {/* Database User Section */}
 <div className="bg-card-light rounded-lg shadow p-6 mb-6">
 <h2 className="text-xl font-semibold mb-4 text-green-400">
 📊 Database User (users table)
 </h2>
 {dbUser ? (
 <div className="space-y-2 font-mono text-sm">
 <p><strong>ID:</strong> {dbUser.id}</p>
 <p><strong>Email:</strong> {dbUser.email}</p>
 <p><strong>Role:</strong> <span className={dbUser.role === 'merchant' ? 'text-green-500 font-bold' : 'text-blue-500'}>{dbUser.role}</span></p>
 <p><strong>Full Name:</strong> {dbUser.full_name || 'N/A'}</p>
 <p><strong>Phone:</strong> {dbUser.phone || 'N/A'}</p>
 <p><strong>Governorate:</strong> {dbUser.governorate || 'N/A'}</p>
 <p><strong>Updated:</strong> {dbUser.updated_at}</p>
 </div>
 ) : (
 <p className="text-yellow-500">User not found in database</p>
 )}
 </div>

 {/* Store Section */}
 <div className="bg-card-light rounded-lg shadow p-6 mb-6">
 <h2 className="text-xl font-semibold mb-4 text-purple-400">
 🏪 Store (stores table)
 </h2>
 {store ? (
 <div className="space-y-2 font-mono text-sm">
 <p><strong>ID:</strong> {store.id}</p>
 <p><strong>Name:</strong> {store.name}</p>
 <p><strong>Is Active:</strong> <span className={store.is_active ? 'text-green-500' : 'text-red-500'}>{store.is_active ? 'Yes' : 'No'}</span></p>
 <p><strong>Category:</strong> {store.category || 'N/A'}</p>
 </div>
 ) : (
 <p className="text-yellow-500">No store found for this user</p>
 )}
 </div>

 {/* Actions Section */}
 <div className="bg-card-light rounded-lg shadow p-6 mb-6">
 <h2 className="text-xl font-semibold mb-4 text-orange-400">
 ⚡ Quick Actions
 </h2>
 <div className="flex flex-wrap gap-4">
 <button
 onClick={() => updateRole('merchant')}
 className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
 >
 Set Role to Merchant
 </button>
 <button
 onClick={() => updateRole('customer')}
 className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded"
 >
 Set Role to Customer
 </button>
 <button
 onClick={logout}
 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
 >
 Logout
 </button>
 <button
 onClick={() => window.location.reload()}
 className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
 >
 Refresh
 </button>
 </div>
 </div>

 {/* Navigation Links */}
 <div className="bg-card-light rounded-lg shadow p-6">
 <h2 className="text-xl font-semibold mb-4 text-cyan-400">
 🔗 Test Links
 </h2>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 <a href="/signup"className="bg-surface-light px-4 py-2 rounded text-center hover:bg-surface-light">
 /signup
 </a>
 <a href="/login"className="bg-surface-light px-4 py-2 rounded text-center hover:bg-surface-light">
 /login
 </a>
 <a href="/merchant/setup"className="bg-surface-light px-4 py-2 rounded text-center hover:bg-surface-light">
 /merchant/setup
 </a>
 <a href="/merchant/pending"className="bg-surface-light px-4 py-2 rounded text-center hover:bg-surface-light">
 /merchant/pending
 </a>
 <a href="/merchant/dashboard"className="bg-surface-light px-4 py-2 rounded text-center hover:bg-surface-light">
 /merchant/dashboard
 </a>
 <a href="/"className="bg-surface-light px-4 py-2 rounded text-center hover:bg-surface-light">
 / (Home)
 </a>
 </div>
 </div>

 {/* Summary */}
 <div className="mt-8 p-4 bg-yellow-900 rounded-lg">
 <h3 className="font-bold mb-2">📋 Current Status:</h3>
 <ul className="list-disc list-inside space-y-1 text-sm">
 <li>Authenticated: {authUser ? '✅ Yes' : '❌ No'}</li>
 <li>In Database: {dbUser ? '✅ Yes' : '❌ No'}</li>
 <li>Role: {dbUser?.role || 'N/A'} {dbUser?.role === 'merchant' ? '🏪' : '👤'}</li>
 <li>Has Store: {store ? '✅ Yes' : '❌ No'}</li>
 <li>Store Active: {store?.is_active ? '✅ Yes' : '❌ No'}</li>
 </ul>
 </div>
 </div>
 </div>
 );
}
