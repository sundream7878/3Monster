import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'buyer' | null;

interface AuthContextType {
    user: User | null;
    email: string | null;
    role: UserRole;
    loading: boolean;
    logout: () => Promise<void>;
    refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    email: null,
    role: null,
    loading: true,
    logout: async () => { },
    refreshRole: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    const checkRole = async (userEmail: string) => {
        try {
            console.log(`🔍 Checking role for: ${userEmail}`);
            const { data, error } = await supabase
                .from('admins')
                .select('email')
                .eq('email', userEmail.toLowerCase())
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows'
                throw error;
            }

            const isAdm = !!data;
            console.log(`📊 Role result: ${isAdm ? 'admin' : 'buyer'}`);
            return isAdm ? 'admin' : 'buyer';
        } catch (error) {
            console.error('❌ Error checking admin role:', error);
            return 'buyer';
        }
    };

    const registerUserMapping = async (uid: string, userEmail: string) => {
        try {
            const emailKey = userEmail.toLowerCase();
            // Supabase에서는 auth.users에 이미 매핑되지만, 메타데이터 관리를 위해 buyers나 별도 로그 테이블에 기록할 수 있음
            console.log(`👤 User mapping logic moved to Supabase: ${uid} -> ${emailKey}`);
        } catch (error: any) {
            console.error('❌ Error registering user mapping:', error);
        }
    };

    const refreshRole = async () => {
        const userEmail = localStorage.getItem('user_email');
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (userEmail && currentUser) {
            const detectedRole = await checkRole(userEmail);
            setRole(detectedRole);
            setEmail(userEmail.toLowerCase());
            await registerUserMapping(currentUser.id, userEmail);
        }
    };

    useEffect(() => {
        // 초기 세션 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                handleUserChange(session.user);
            } else {
                setLoading(false);
            }
        });

        // 상태 변경 감지
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                handleUserChange(session.user);
            } else {
                setUser(null);
                setEmail(null);
                setRole(null);
                localStorage.removeItem('user_email');
                setLoading(false);
            }
        });

        const handleUserChange = async (supabaseUser: User) => {
            const userEmail = localStorage.getItem('user_email');
            if (userEmail) {
                const detectedRole = await checkRole(userEmail);
                setRole(detectedRole);
                setEmail(userEmail.toLowerCase());
                await registerUserMapping(supabaseUser.id, userEmail);
            } else {
                setRole('buyer');
                setEmail(null);
            }
            setUser(supabaseUser);
            setLoading(false);
        };

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        localStorage.removeItem('user_email');
        localStorage.removeItem('buyer_email');
        await supabase.auth.signOut();
    };

    const value = {
        user,
        email,
        role,
        loading,
        logout,
        refreshRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
