import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { OtpInput } from './ui/OtpInput';
import { Mail, ChevronRight, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportWrapperProps {
    children: React.ReactNode;
}

export const SupportWrapper: React.FC<SupportWrapperProps> = ({ children }) => {
    const { user, email: authEmail, refreshRole } = useAuth();
    const [email, setEmail] = useState(() => localStorage.getItem('remember_email') || '');
    const [otp, setOtp] = useState('');
    const [otpStep, setOtpStep] = useState(1); // 1: Email, 2: OTP
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email) return;
        setLoading(true);
        setError('');
        setInfoMessage('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                await supabase.auth.signInAnonymously();
            }

            const emailKey = email.toLowerCase();
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            
            const { error: upsertError } = await supabase
                .from('otps')
                .upsert({ 
                    email: emailKey, 
                    code, 
                    expires_at: expiresAt 
                }, { onConflict: 'email' });

            if (upsertError) throw upsertError;

            // FOR DEVELOPMENT: Log OTP to console
            console.log('-----------------------------------------');
            console.log('🔓 [DEV ONLY] OTP CODE:', code);
            console.log('📧 Target Email:', emailKey);
            console.log('-----------------------------------------');

            const res = await fetch('/api/resend/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: '3Monster <admin@3monster.net>',
                    to: [emailKey],
                    subject: '[3Monster] 로그인 인증번호',
                    html: `
                        <div style="font-family: sans-serif; padding: 40px; color: #334155; line-height: 1.6;">
                            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                                <div style="background: #0f172a; padding: 40px; text-align: center;">
                                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">3Monster</h1>
                                </div>
                                <div style="padding: 40px;">
                                    <h2 style="color: #0f172a; margin-top: 0; font-weight: 800; font-size: 20px;">고객센터 로그인 인증번호</h2>
                                    <p>안녕하세요, 3Monster 통합 고객센터입니다.</p>
                                    <p>고객센터 문의 접수 및 본인 확인을 위한 6자리 인증번호를 안내해 드립니다.</p>
                                    
                                    <div style="background: #f8fafc; border-radius: 16px; padding: 32px; margin: 32px 0; text-align: center;">
                                        <div style="font-size: 48px; font-weight: 900; color: #6200EE; letter-spacing: 0.2em;">${code}</div>
                                        <div style="margin-top: 12px; font-size: 13px; color: #94a3b8; font-weight: 600;">유효시간: 5분</div>
                                    </div>
                                    
                                    <p style="font-size: 14px; color: #64748b;">본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.</p>
                                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
                                    <p style="font-size: 12px; color: #94a3b8; margin: 0;">본 메일은 발신전용입니다. 관련 문의는 공식 홈페이지를 이용해 주세요.</p>
                                </div>
                            </div>
                        </div>
                    `,
                }),
            });

            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                let errorMessage = '이메일 발송에 실패했습니다.';
                
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await res.json();
                    console.error('Resend API Error details:', errorData);
                    errorMessage = errorData.message || errorMessage;
                    
                    if (res.status === 403) {
                        setError('Resend 샌드박스 모드 제한: 등록된 이메일 또는 도메인만 발송 가능합니다. 개발자 도구(F12) 콘솔에서 인증번호를 확인해주세요!');
                        setOtpStep(2);
                        return;
                    }
                }
                throw new Error(errorMessage);
            }

            setInfoMessage('인증번호가 메일로 전송되었습니다.');
            setOtpStep(2);
        } catch (err: any) {
            console.error('OTP Error:', err);
            setError(err.message || '인증번호 전송 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');
        setInfoMessage('');
        try {
            const { data: otpData, error: otpError } = await supabase
                .from('otps')
                .select('*')
                .eq('email', email.toLowerCase())
                .maybeSingle();

            if (otpError || !otpData || otpData.code !== otp) {
                setError('인증번호가 올바르지 않거나 만료되었습니다.');
                return;
            }

            const expiresAt = new Date(otpData.expires_at);
            if (new Date() > expiresAt) {
                setError('인증번호가 만료되었습니다. 다시 시도해주세요.');
                setOtpStep(1);
                setOtp('');
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                await supabase.auth.signInAnonymously();
            }
            
            const emailKey = email.toLowerCase();
            localStorage.setItem('user_email', emailKey);
            localStorage.setItem('buyer_email', emailKey); 
            localStorage.setItem('remember_email', emailKey);
            
            console.log('🔄 Syncing user session for Customer Support...');
            await refreshRole();
        } catch (err: any) {
            setError('인증 처리 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Auto submit when OTP reaches 6 digits
    useEffect(() => {
        if (otp.length === 6 && otpStep === 2 && !loading) {
            handleLogin();
        }
    }, [otp, otpStep]);

    // If already authorized, directly render the children (Customer Support content)
    if (user && authEmail) {
        return <>{children}</>;
    }

    return (
        <div className="max-w-md mx-auto my-12 px-4">
            <Card className="p-8 shadow-premium border-none bg-white rounded-3xl">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                        <KeyRound className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">고객센터 이메일 인증</h2>
                    <p className="text-slate-400 font-bold text-xs leading-relaxed">
                        3Monster 구매 고객 및 이용자 확인을 위해 <br />
                        최초 1회 이메일 인증이 필요합니다.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`step-${otpStep}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일 주소</label>
                                <input
                                    id="support-email"
                                    name="email"
                                    type="email"
                                    placeholder="your-email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={otpStep === 2}
                                    className="flex h-12 w-full rounded-2xl border-2 border-slate-400 bg-white px-5 py-2 text-sm text-slate-800 transition-all outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 font-black placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                                />
                            </div>
                            
                            {otpStep === 2 && (
                                <div className="space-y-2 animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">인증번호 (6자리)</label>
                                        <button 
                                            type="button" 
                                            onClick={() => { setOtpStep(1); setOtp(''); }}
                                            className="text-[10px] font-black text-indigo-600 hover:underline"
                                        >
                                            이메일 변경
                                        </button>
                                    </div>
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={loading}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {infoMessage && (
                        <div className="flex gap-2 items-start text-xs text-emerald-600 font-bold bg-emerald-50 p-4 rounded-xl animate-in fade-in duration-200">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                            <p className="leading-relaxed">{infoMessage}</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex gap-2 items-start text-xs text-red-500 font-bold bg-red-50 p-4 rounded-xl animate-in fade-in duration-200">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                            <p className="leading-relaxed">{error}</p>
                        </div>
                    )}

                    {otpStep === 1 ? (
                        <Button 
                            type="button" 
                            className="w-full h-12 text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10" 
                            onClick={handleSendOTP}
                            isLoading={loading}
                            disabled={!email}
                        >
                            <Mail className="w-4 h-4 mr-2" /> 인증번호 전송
                        </Button>
                    ) : (
                        <Button 
                            type="submit" 
                            className="w-full h-12 text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10" 
                            isLoading={loading}
                            disabled={otp.length !== 6}
                        >
                            인증 완료 후 3Monster 입장 <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    )}
                </form>
            </Card>
        </div>
    );
};
