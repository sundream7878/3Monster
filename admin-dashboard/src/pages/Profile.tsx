import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
    User, 
    Mail, 
    Calendar, 
    Bell, 
    LogOut, 
    ShoppingBag, 
    Check, 
    AlertCircle, 
    Shield,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface LicenseItem {
    id: string;
    product_id: string;
    serial_key: string;
    status: string;
    expire_date: string;
    created_at: string;
}

export const Profile = () => {
    const { email: authEmail, logout } = useAuth();
    const userEmail = authEmail || localStorage.getItem('user_email') || '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // User Profile state
    const [name, setName] = useState('');
    const [signupDate, setSignupDate] = useState('');
    const [channel, setChannel] = useState('');
    
    // Notification toggles
    const [emailNotify, setEmailNotify] = useState(() => {
        return localStorage.getItem('notify_email') !== 'false';
    });
    const [updateNotify, setUpdateNotify] = useState(() => {
        return localStorage.getItem('notify_updates') !== 'false';
    });

    // Purchase List state
    const [licenses, setLicenses] = useState<LicenseItem[]>([]);

    useEffect(() => {
        if (!userEmail) return;

        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // 1. Fetch User details
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', userEmail.toLowerCase())
                    .maybeSingle();

                if (userError) throw userError;

                if (userData) {
                    setName(userData.name || '');
                    setChannel(userData.channel || 'Direct');
                    if (userData.created_at) {
                        const date = new Date(userData.created_at);
                        setSignupDate(`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`);
                    }
                }

                // 2. Fetch Licenses details
                const { data: licenseData, error: licenseError } = await supabase
                    .from('licenses')
                    .select('*')
                    .eq('contact', userEmail.toLowerCase())
                    .order('created_at', { ascending: false });

                if (licenseError) throw licenseError;
                setLicenses(licenseData || []);

            } catch (err: any) {
                console.error("Error loading profile details:", err);
                setErrorMessage("프로필 정보를 불러오는 중에 문제가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [userEmail]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const { error: updateError } = await supabase
                .from('users')
                .upsert({
                    email: userEmail.toLowerCase(),
                    name: name.trim(),
                    channel: channel
                }, { onConflict: 'email' });

            if (updateError) throw updateError;

            // Save notifications setting locally
            localStorage.setItem('notify_email', String(emailNotify));
            localStorage.setItem('notify_updates', String(updateNotify));

            setSuccessMessage("프로필 설정이 안전하게 업데이트되었습니다.");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error("Error saving profile details:", err);
            setErrorMessage("설정 저장 중 에러가 발생했습니다: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
            case 'used':
                return (
                    <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-full flex items-center gap-1 w-fit">
                        <Check className="w-3 h-3" /> 유지 (사용중)
                    </span>
                );
            case 'unused':
                return (
                    <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1 w-fit">
                        대기 (미사용)
                    </span>
                );
            case 'blocked':
                return (
                    <span className="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-full flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" /> 차단됨
                    </span>
                );
            case 'expired':
            default:
                return (
                    <span className="px-2.5 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-full flex items-center gap-1 w-fit">
                        종료 (만료)
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold text-xs">프로필 정보를 불러오고 있습니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 py-12 px-6 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header title */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            마이페이지 & 설정 <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                        </h1>
                        <p className="text-xs text-slate-400 font-bold">3Monster 서비스 이용 현황 및 계정 프로필 관리</p>
                    </div>
                </div>

                {/* Status messages */}
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-2xl"
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <p className="text-xs font-bold">{successMessage}</p>
                    </motion.div>
                )}
                {errorMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-rose-50 text-rose-600 border border-rose-100 p-4 rounded-2xl"
                    >
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        <p className="text-xs font-bold">{errorMessage}</p>
                    </motion.div>
                )}

                {/* Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Purchase list (7/12) */}
                    <div className="lg:col-span-7 space-y-4">
                        <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-sm font-black text-slate-800">구매 리스트 ({licenses.length})</h3>
                            </div>

                            {licenses.length === 0 ? (
                                <div className="text-center py-16 space-y-3">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold">등록된 구매 내역이 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {licenses.map((lic) => {
                                        const date = lic.created_at ? new Date(lic.created_at).toLocaleDateString() : 'N/A';
                                        const expDate = lic.expire_date ? new Date(lic.expire_date).toLocaleDateString() : '평생 무제한';
                                        
                                        return (
                                            <div 
                                                key={lic.id} 
                                                className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 hover:border-indigo-100 rounded-xl transition-all duration-200 text-left space-y-3 group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                                                            {lic.product_id}
                                                        </span>
                                                        <h4 className="text-xs font-black text-slate-700 mt-1.5 break-all">
                                                            시리얼: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-650">{lic.serial_key}</code>
                                                        </h4>
                                                    </div>
                                                    {getStatusBadge(lic.status)}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-100/50">
                                                    <div>
                                                        <span className="block text-slate-400 font-medium">등록 일시</span>
                                                        <span className="font-bold text-slate-700">{date}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-slate-400 font-medium">만료일 (기간)</span>
                                                        <span className="font-bold text-slate-700">{expDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Settings / Profile / Logout (5/12) */}
                    <div className="lg:col-span-5 space-y-4">
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-6">
                                
                                {/* 1. Account details */}
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Shield className="w-5 h-5 text-indigo-600" />
                                        <h3 className="text-sm font-black text-slate-800">계정 프로필 정보</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                                <Mail className="w-3.5 h-3.5" /> 이메일 주소 / ID
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-800 font-black">{userEmail}</span>
                                                <span className="text-[10px] text-slate-400 mt-0.5">ID: {userEmail.split('@')[0]}</span>
                                            </div>
                                        </div>

                                        {signupDate && (
                                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                                                    <Calendar className="w-3.5 h-3.5" /> 가입 일자
                                                </div>
                                                <span className="text-xs text-slate-700 font-bold">{signupDate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Secondary Auth Info */}
                                <div className="space-y-3.5 text-left">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <User className="w-5 h-5 text-indigo-600" />
                                        <h3 className="text-sm font-black text-slate-800">크몽 닉네임 (2차 인증 정보)</h3>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400">크몽 구매자 닉네임 (입력/수정 가능)</label>
                                        <Input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="크몽 닉네임을 입력해 주세요"
                                            className="h-10 bg-slate-50 border-slate-200 focus-visible:bg-white rounded-lg text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400">가입 채널</label>
                                        <select 
                                            value={channel}
                                            onChange={e => setChannel(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 outline-none text-xs text-slate-700 font-bold"
                                        >
                                            <option value="Kmong">크몽 (Kmong)</option>
                                            <option value="Direct">직접 가입 (Direct)</option>
                                            <option value="Kmong (Pending)">크몽 승인 대기</option>
                                        </select>
                                    </div>
                                </div>

                                {/* 3. Notifications settings */}
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Bell className="w-5 h-5 text-indigo-600" />
                                        <h3 className="text-sm font-black text-slate-800">알림 설정</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={emailNotify}
                                                onChange={e => setEmailNotify(e.target.checked)}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                            />
                                            <span className="text-xs text-slate-650 font-bold">인증 및 로그인 시 이메일 알림 받기</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={updateNotify}
                                                onChange={e => setUpdateNotify(e.target.checked)}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                            />
                                            <span className="text-xs text-slate-650 font-bold">프로그램 업데이트 및 점검 소식 메일 받기</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Actions: Save changes */}
                                <div className="pt-2">
                                    <Button 
                                        type="submit" 
                                        isLoading={saving}
                                        className="w-full h-10 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10"
                                    >
                                        설정 변경사항 저장
                                    </Button>
                                </div>

                                {/* 4. Logout (Bottom Right aligned) */}
                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <Button 
                                        type="button"
                                        onClick={logout}
                                        className="h-9 px-4 text-[11px] font-bold border border-rose-200 text-rose-600 hover:bg-rose-50/50 rounded-lg flex items-center gap-1.5 transition-all"
                                    >
                                        <LogOut className="w-3.5 h-3.5" /> 로그아웃
                                    </Button>
                                </div>
                            </Card>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};
