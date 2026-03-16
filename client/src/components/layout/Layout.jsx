import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Leaf, BarChart3, Settings, Trophy, Wind, Activity, Menu, X, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { App as CapacitorApp } from '@capacitor/app';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Activity, label: 'Live Data', path: '/live' },
        { icon: Wind, label: 'Emissions', path: '/emissions' },
        { icon: BarChart3, label: 'Analysis', path: '/behavior' },
        { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
        { icon: Settings, label: 'Account', path: '/account' },
    ];

    // Handle Android back button
    useEffect(() => {
        const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            // If mobile menu is open, close it
            if (mobileMenuOpen) {
                setMobileMenuOpen(false);
                return;
            }

            // If we can go back in browser history, do that
            if (canGoBack || window.history.length > 1) {
                navigate(-1);
            } else {
                // Only exit if on home page
                if (location.pathname === '/') {
                    CapacitorApp.exitApp();
                } else {
                    navigate('/');
                }
            }
        });

        return () => {
            handleBackButton.remove();
        };
    }, [mobileMenuOpen, navigate, location.pathname]);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleNavClick = (path) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-transparent text-foreground flex overflow-hidden">
            {/* Background Particles/Stars Effect (Abstract) */}
            <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/20 rounded-full blur-[100px] animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/20 rounded-full blur-[100px] animate-pulse-glow delay-1000" />
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
                    style={{ zIndex: 10000 }}
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 flex flex-col glass border-r border-white/10 transform transition-transform duration-300 ease-out md:hidden pt-8",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )} style={{ zIndex: 10001 }}>
                {/* Sidebar Glow Line */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-cyan via-transparent to-neon-purple opacity-50" />

                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <img src="/logo.avif" alt="EcoScorer" className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan to-neon-purple">
                                EcoScorer
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={24} className="text-white" />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavClick(item.path)}
                                className={cn(
                                    "w-full group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ease-out",
                                    "hover:bg-white/5 text-left",
                                    isActive
                                        ? "bg-white/10 text-white shadow-[0_0_20px_rgba(0,255,255,0.15)] border border-neon-cyan/30"
                                        : "text-muted-foreground hover:text-neon-cyan"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-cyan rounded-r-full shadow-[0_0_10px_#00ffff]" />
                                )}
                                <Icon
                                    size={22}
                                    className={cn(
                                        "transition-all duration-300",
                                        isActive ? "text-neon-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" : "group-hover:text-neon-cyan"
                                    )}
                                />
                                <span className={cn("font-medium tracking-wide", isActive && "text-neon-cyan")}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 mx-4 mb-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-space-light to-space-dark border border-neon-purple/30 flex items-center justify-center text-neon-purple font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                            <button
                                onClick={logout}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                            >
                                <LogOut size={12} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Desktop Sidebar */}
            <aside className="w-72 hidden md:flex flex-col m-4 rounded-2xl glass border-white/5 border-[1px] relative overflow-hidden">
                {/* Sidebar Glow Line */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-cyan via-transparent to-neon-purple opacity-50" />

                <div className="p-8 pb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                        <span className="text-white font-bold text-lg">E</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan to-neon-purple tracking-wide">
                            EcoScorer
                        </h1>
                        <p className="text-xs text-neon-cyan/70 tracking-widest uppercase">Future Metrics</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ease-out",
                                    "hover:bg-white/5",
                                    isActive
                                        ? "bg-white/10 text-white shadow-[0_0_20px_rgba(0,255,255,0.15)] border border-neon-cyan/30"
                                        : "text-muted-foreground hover:text-neon-cyan"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-cyan rounded-r-full shadow-[0_0_10px_#00ffff]" />
                                )}
                                <Icon
                                    size={22}
                                    className={cn(
                                        "transition-all duration-300",
                                        isActive ? "text-neon-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" : "group-hover:text-neon-cyan group-hover:scale-110"
                                    )}
                                />
                                <span className={cn("font-medium tracking-wide", isActive && "text-neon-cyan")}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mx-4 mb-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-space-light to-space-dark border border-neon-purple/30 flex items-center justify-center text-neon-purple font-bold shadow-[0_0_10px_rgba(157,78,221,0.3)]">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                            <button
                                onClick={logout}
                                className="text-xs text-muted-foreground hover:text-neon-purple transition-colors text-left flex items-center gap-1 group"
                            >
                                <span className="group-hover:underline decoration-neon-purple/50">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Mobile Header with Hamburger Menu - pt-6 for status bar */}
                <header className="md:hidden pt-6 pb-3 border-b border-white/10 glass flex items-center px-4 justify-between relative z-50">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <Menu size={24} className="text-white" />
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.avif" alt="EcoScorer" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan to-neon-purple">EcoScorer</span>
                    </div>
                    <div className="w-10" /> {/* Spacer for balance */}
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
