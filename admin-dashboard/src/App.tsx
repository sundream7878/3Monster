import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { LicenseGenerator } from './pages/LicenseGenerator';
import { LicenseList } from './pages/LicenseList';
import { CustomerSupport } from './pages/CustomerSupport';
import { Login } from './pages/Login';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

function AppRoutes() {
    const { role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
                <ProtectedRoute>
                    <DashboardLayout />
                </ProtectedRoute>
            }>
                {/* Admin Routes */}
                {role === 'admin' && (
                    <>
                        <Route index element={<Dashboard />} />
                        <Route path="generator" element={<LicenseGenerator />} />
                        <Route path="licenses" element={<LicenseList />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                )}
                {/* Buyer Routes */}
                {role === 'buyer' && (
                    <>
                        <Route path="support" element={<CustomerSupport />} />
                        <Route path="*" element={<Navigate to="/support" replace />} />
                        <Route index element={<Navigate to="/support" replace />} />
                    </>
                )}
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
