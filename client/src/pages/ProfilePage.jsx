import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, Award, Settings, Edit2, Plus, Lock, X, Save, Trash2, User, Mail, Key, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import NeonButton from '../components/ui/NeonButton';

// API URL
const API_URL = "https://ecoscorer-production.up.railway.app/api";

const ProfilePage = () => {
    const { user, logout, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('settings');

    // Profile editing state
    const [editMode, setEditMode] = useState(false);
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Settings state
    const [co2Limit, setCo2Limit] = useState(28);
    const [holoMode, setHoloMode] = useState(true);

    // UI state
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Fleet management state
    const [vehicles, setVehicles] = useState([
        { id: 1, name: 'Primary Vehicle', make: 'Tesla', model: 'Model 3', year: 2023, fuel: 'Electric' },
    ]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [newVehicle, setNewVehicle] = useState({ name: '', make: '', model: '', year: 2024, fuel: 'Gasoline' });

    // Badges
    const [badges] = useState([
        { id: 1, name: 'First Drive', icon: '🚀', desc: 'Completed first trip', unlocked: true },
        { id: 2, name: 'Eco Warrior', icon: '🌱', desc: 'Saved 100kg CO2', unlocked: true },
        { id: 3, name: 'Speed Master', icon: '⚡', desc: 'Maintain optimal speed', unlocked: false },
        { id: 4, name: 'Night Driver', icon: '🌌', desc: 'Night drive master', unlocked: false },
    ]);

    // Load saved settings on mount and when user changes
    useEffect(() => {
        setUsername(user?.username || '');
        setEmail(user?.email || '');
    }, [user]);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('ecoscorerSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                setCo2Limit(settings.co2Limit || 28);
                setHoloMode(settings.holoMode ?? true);
            }

            const savedVehicles = localStorage.getItem('ecoscorerVehicles');
            if (savedVehicles) {
                setVehicles(JSON.parse(savedVehicles));
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }, []);

    // Get auth token
    const getToken = () => localStorage.getItem('token');

    // Save profile changes
    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMessage('');

        // Validate
        if (newPassword && newPassword !== confirmPassword) {
            setSaveMessage('❌ Passwords do not match');
            setSaving(false);
            return;
        }

        if (newPassword && !currentPassword) {
            setSaveMessage('❌ Enter current password');
            setSaving(false);
            return;
        }

        try {
            const token = getToken();
            console.log('Token exists:', !!token, token?.substring(0, 20) + '...');
            console.log('API URL:', API_URL);

            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: username !== user?.username ? username : undefined,
                    email: email !== user?.email ? email : undefined,
                    currentPassword: currentPassword || undefined,
                    newPassword: newPassword || undefined
                })
            });

            const data = await response.json();
            console.log('Response:', response.status, data);

            if (response.ok) {
                setSaveMessage('✅ Profile updated!');
                // Update local user state
                if (updateUser && data.user) {
                    updateUser(data.user);
                }
                // Reset password fields
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setEditMode(false);
            } else {
                setSaveMessage(`❌ ${data.message || 'Update failed'}`);
            }
        } catch (error) {
            setSaveMessage('❌ Connection error');
        }

        setSaving(false);
        setTimeout(() => setSaveMessage(''), 5000);
    };

    // Save settings (local)
    const handleSaveSettings = () => {
        localStorage.setItem('ecoscorerSettings', JSON.stringify({
            co2Limit,
            holoMode
        }));
        setSaveMessage('✅ Settings saved!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    // Delete account
    const handleDeleteAccount = async () => {
        setDeleting(true);

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/auth/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: deletePassword })
            });

            const data = await response.json();

            if (response.ok) {
                // Clear local storage
                localStorage.removeItem('ecoscorerToken');
                localStorage.removeItem('ecoscorerUser');
                // Logout
                logout();
            } else {
                alert(data.message || 'Failed to delete account');
            }
        } catch (error) {
            alert('Connection error');
        }

        setDeleting(false);
    };

    // Vehicle handlers
    const handleAddVehicle = () => {
        if (!newVehicle.name || !newVehicle.make || !newVehicle.model) {
            alert('Please fill in all fields');
            return;
        }
        const vehicle = { ...newVehicle, id: Date.now() };
        const updated = [...vehicles, vehicle];
        setVehicles(updated);
        localStorage.setItem('ecoscorerVehicles', JSON.stringify(updated));
        setNewVehicle({ name: '', make: '', model: '', year: 2024, fuel: 'Gasoline' });
        setShowAddModal(false);
    };

    const handleEditVehicle = (vehicle) => setEditingVehicle({ ...vehicle });

    const handleSaveVehicle = () => {
        const updated = vehicles.map(v => v.id === editingVehicle.id ? editingVehicle : v);
        setVehicles(updated);
        localStorage.setItem('ecoscorerVehicles', JSON.stringify(updated));
        setEditingVehicle(null);
    };

    const handleDeleteVehicle = (id) => {
        if (confirm('Delete this vehicle?')) {
            const updated = vehicles.filter(v => v.id !== id);
            setVehicles(updated);
            localStorage.setItem('ecoscorerVehicles', JSON.stringify(updated));
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Pilot Profile</h1>

            {/* Profile Header */}
            <GlassCard className="p-8 flex flex-col md:flex-row items-center gap-8" neonColor="cyan">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple p-1">
                        <div className="w-full h-full rounded-full bg-space-dark flex items-center justify-center text-3xl font-bold text-white">
                            {user?.username?.charAt(0).toUpperCase() || 'P'}
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-neon-green rounded-full border-2 border-space-dark shadow-[0_0_10px_#00ff88]" />
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                        <span className="text-xs text-muted-foreground bg-white/10 px-2 py-1 rounded">ID: {user?.id}</span>
                    </div>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <div className="flex gap-4 justify-center md:justify-start mt-2">
                        <span className="px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-medium border border-neon-cyan/20">
                            Level 5 Pilot
                        </span>
                        <span className="px-3 py-1 rounded-full bg-neon-purple/10 text-neon-purple text-xs font-medium border border-neon-purple/20">
                            {vehicles.length} Vehicles
                        </span>
                    </div>
                </div>
            </GlassCard>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl backdrop-blur-md border border-white/10 w-full md:w-fit">
                {['settings', 'vehicles', 'badges'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-medium transition-all duration-300 capitalize flex items-center gap-2 justify-center ${activeTab === tab ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'text-muted-foreground hover:text-white'}`}
                    >
                        {tab === 'vehicles' && <Car size={16} />}
                        {tab === 'badges' && <Award size={16} />}
                        {tab === 'settings' && <Settings size={16} />}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-500">
                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Profile Settings */}
                        <GlassCard className="p-8 space-y-6" neonColor="purple">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Account Details</h3>
                                {!editMode && (
                                    <NeonButton variant="secondary" onClick={() => setEditMode(true)}>
                                        <Edit2 size={16} /> Edit
                                    </NeonButton>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User size={14} /> Username
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={!editMode}
                                        className={`bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50 ${!editMode && 'opacity-60'}`}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Mail size={14} /> Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={!editMode}
                                        className={`bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50 ${!editMode && 'opacity-60'}`}
                                    />
                                </div>

                                {editMode && (
                                    <>
                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                                                <Key size={14} /> Change Password (optional)
                                            </p>
                                            <div className="space-y-3">
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="Current password"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                                />
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="New password"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                                />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm new password"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <NeonButton variant="primary" className="flex-1" onClick={handleSaveProfile} disabled={saving}>
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </NeonButton>
                                            <NeonButton variant="secondary" onClick={() => {
                                                setEditMode(false);
                                                setUsername(user?.username || '');
                                                setEmail(user?.email || '');
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }}>
                                                Cancel
                                            </NeonButton>
                                        </div>
                                    </>
                                )}

                                {saveMessage && <p className="text-sm mt-2">{saveMessage}</p>}
                            </div>
                        </GlassCard>

                        {/* App Settings */}
                        <GlassCard className="p-8 space-y-6" neonColor="orange">
                            <h3 className="text-xl font-bold text-white">App Settings</h3>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-muted-foreground">Daily CO2 Limit (kg)</label>
                                    <input
                                        type="number"
                                        value={co2Limit}
                                        onChange={(e) => setCo2Limit(Number(e.target.value))}
                                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan/50"
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-medium">Holographic Mode</h4>
                                        <p className="text-xs text-muted-foreground">Enable enhanced visual effects</p>
                                    </div>
                                    <button
                                        onClick={() => setHoloMode(!holoMode)}
                                        className={`w-12 h-6 rounded-full border relative cursor-pointer transition-all ${holoMode ? 'bg-neon-cyan/20 border-neon-cyan/50' : 'bg-white/10 border-white/20'}`}
                                    >
                                        <div className={`absolute top-1 bottom-1 w-4 rounded-full transition-all ${holoMode ? 'right-1 bg-neon-cyan shadow-[0_0_10px_#00ffff]' : 'left-1 bg-gray-400'}`} />
                                    </button>
                                </div>

                                <NeonButton variant="primary" className="w-full mt-4" onClick={handleSaveSettings}>
                                    Save Settings
                                </NeonButton>
                            </div>
                        </GlassCard>

                        {/* Danger Zone */}
                        <GlassCard className="p-8 space-y-4 lg:col-span-2" neonColor="red">
                            <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                                <AlertTriangle size={20} /> Danger Zone
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Once you delete your account, there is no going back. All your data will be permanently removed.
                            </p>
                            <NeonButton
                                variant="secondary"
                                className="!border-red-500/50 !text-red-400 hover:!bg-red-500/20"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 size={16} /> Delete Account
                            </NeonButton>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'vehicles' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">My Fleet</h3>
                            <NeonButton variant="secondary" className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
                                <Plus size={16} /> Add Vehicle
                            </NeonButton>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {vehicles.map((car, index) => (
                                <GlassCard key={car.id} className="p-6 relative group" neonColor="cyan" delay={index}>
                                    {editingVehicle?.id === car.id ? (
                                        <div className="space-y-4">
                                            <input type="text" value={editingVehicle.name} onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="Vehicle Name" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={editingVehicle.make} onChange={(e) => setEditingVehicle({ ...editingVehicle, make: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
                                                <input type="text" value={editingVehicle.model} onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
                                            </div>
                                            <div className="flex gap-2">
                                                <NeonButton variant="primary" className="flex-1" onClick={handleSaveVehicle}><Save size={16} /> Save</NeonButton>
                                                <NeonButton variant="secondary" onClick={() => setEditingVehicle(null)}><X size={16} /></NeonButton>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 rounded-xl bg-neon-cyan/10"><Car className="text-neon-cyan" size={24} /></div>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-white/5 text-muted-foreground border border-white/10">{car.fuel}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-white">{car.name}</h4>
                                            <p className="text-muted-foreground">{car.year} {car.make} {car.model}</p>
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditVehicle(car)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><Edit2 size={16} className="text-white" /></button>
                                                <button onClick={() => handleDeleteVehicle(car.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40"><Trash2 size={16} className="text-red-400" /></button>
                                            </div>
                                        </>
                                    )}
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {badges.map((badge, index) => (
                            <GlassCard key={badge.id} className={`p-6 flex flex-col items-center text-center gap-4 ${!badge.unlocked && 'opacity-50 grayscale'}`} neonColor={badge.unlocked ? "purple" : "none"} delay={index}>
                                <div className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{badge.icon}</div>
                                <div>
                                    <h4 className="font-bold text-white mb-1 flex items-center justify-center gap-2">{badge.name}{!badge.unlocked && <Lock size={12} />}</h4>
                                    <p className="text-xs text-muted-foreground">{badge.desc}</p>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-md p-8 space-y-6" neonColor="cyan">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Add New Vehicle</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-white/10"><X size={20} className="text-muted-foreground" /></button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" value={newVehicle.name} onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Vehicle Name" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" value={newVehicle.make} onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Make" />
                                <input type="text" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Model" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white" />
                                <select value={newVehicle.fuel} onChange={(e) => setNewVehicle({ ...newVehicle, fuel: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white">
                                    <option value="Gasoline">Gasoline</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Electric">Electric</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                            <NeonButton variant="primary" className="w-full" onClick={handleAddVehicle}><Plus size={16} /> Add Vehicle</NeonButton>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="w-full max-w-md p-8 space-y-6" neonColor="red">
                        <div className="text-center">
                            <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-white">Delete Account?</h3>
                            <p className="text-muted-foreground mt-2">
                                This action cannot be undone. All your data, vehicles, and driving history will be permanently deleted.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter your password to confirm"
                                className="w-full bg-white/5 border border-red-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                            />

                            <div className="flex gap-3">
                                <NeonButton
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </NeonButton>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting || !deletePassword}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete Forever'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
