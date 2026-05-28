import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { Showroom } from './pages/Showroom';
import { Dashboard } from './pages/Dashboard';
import { LicenseGenerator } from './pages/LicenseGenerator';
import { LicenseList } from './pages/LicenseList';
import { CustomerSupport } from './pages/CustomerSupport';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { SupportWrapper } from './components/SupportWrapper';

function AppRoutes() {
    return (
        <Routes>
            {/* Public Showcase / Landing page */}
            <Route path="/" element={
                <PublicLayout>
                    <Showroom />
                </PublicLayout>
            } />

            {/* Publicly accessible Support page (Auth validation is done inline in SupportWrapper) */}
            <Route path="/support" element={
                <PublicLayout>
                    <SupportWrapper>
                        <CustomerSupport />
                    </SupportWrapper>
                </PublicLayout>
            } />

            {/* Profile Page */}
            <Route path="/profile" element={
                <PublicLayout>
                    <SupportWrapper>
                        <Profile />
                    </SupportWrapper>
                </PublicLayout>
            } />

            {/* Standalone Login page */}
            <Route path="/login" element={<Login />} />

            {/* Restricted Admin Area */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="generator" element={<LicenseGenerator />} />
                <Route path="licenses" element={<LicenseList />} />
            </Route>

            {/* Fallback Redirection */}
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
