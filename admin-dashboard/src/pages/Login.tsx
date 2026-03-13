import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ChevronRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bootstrapAdmins } from '../bootstrap-admins';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
    const { refreshRole } = useAuth();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpStep, setOtpStep] = useState(1); // 1: Email, 2: OTP
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Bootstrap admins on load (Temporary - only runs until Firestore is populated)
    React.useEffect(() => {
        bootstrapAdmins();
    }, []);

    const handleSendOTP = async () => {
        if (!email) return;
        setLoading(true);
        setError('');
        try {
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }

            const emailKey = email.toLowerCase();
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            await setDoc(doc(db, 'otps', emailKey), {
                code,
                createdAt: serverTimestamp(),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            });

            // FOR DEVELOPMENT: Log OTP to console so you can test even if email fails
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
                    from: '3Monster <onboarding@resend.dev>',
                    to: [emailKey],
                    subject: '[3Monster] 로그인 인증번호',
                    html: `
                        <div style="font-family: sans-serif; padding: 40px; color: #334155; line-height: 1.6;">
                            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                                <div style="background: #0f172a; padding: 40px; text-align: center;">
                                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">3Monster</h1>
                                </div>
                                <div style="padding: 40px;">
                                    <h2 style="color: #0f172a; margin-top: 0; font-weight: 800; font-size: 20px;">인증번호 안내</h2>
                                    <p>안녕하세요, 3Monster 서비스를 이용해 주셔서 감사합니다.</p>
                                    <p>서비스 접속을 위한 6자리 인증번호를 안내해 드립니다.</p>
                                    
                                    <div style="background: #f8fafc; border-radius: 16px; padding: 32px; margin: 32px 0; text-align: center;">
                                        <div style="font-size: 48px; font-weight: 900; color: #3b82f6; letter-spacing: 0.2em;">${code}</div>
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
                const errorData = await res.json();
                console.error('Resend API Error details:', errorData);
                
                // If sandbox error, give a more helpful message
                if (res.status === 403) {
                    setError('Resend 샌드박스 모드 제한: 등록된 이메일 또는 도메인만 발송 가능합니다. 개발자 도구(F12) 콘솔에서 인증번호를 확인해주세요!');
                    setOtpStep(2); // Still allow going to next step to use console code
                    return;
                }
                throw new Error(errorData.message || '이메일 발송에 실패했습니다.');
            }

            alert(`인증번호가 메일로 전송되었습니다.`);
            setOtpStep(2);
        } catch (err: any) {
            console.error('OTP Error:', err);
            setError(err.message || '인증번호 전송 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const otpDoc = await getDoc(doc(db, 'otps', email.toLowerCase()));
            if (!otpDoc.exists() || otpDoc.data().code !== otp) {
                setError('인증번호가 올바르지 않거나 만료되었습니다.');
                return;
            }

            const expiresAt = otpDoc.data().expiresAt.toDate();
            if (new Date() > expiresAt) {
                setError('인증번호가 만료되었습니다. 다시 시도해주세요.');
                setOtpStep(1);
                return;
            }

            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }
            
            const emailKey = email.toLowerCase();
            localStorage.setItem('user_email', emailKey);
            localStorage.setItem('buyer_email', emailKey); 
            
            // Critical: Refresh role in context before navigating
            await refreshRole();
            
            navigate('/');
        } catch (err: any) {
            setError('로그인 처리 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F4F6FB] px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[480px]"
            >
                <Card className="p-12 shadow-premium border-none bg-white rounded-[2.5rem]">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="h-20 w-auto flex items-center justify-center mb-6">
                            <img src="/logo.png" alt="3Monster Logo" className="h-full object-contain" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">3Monster</h1>
                        <p className="text-slate-400 font-bold">서비스 이용을 위해 로그인해주세요.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`step-${otpStep}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일 주소</label>
                                    <Input
                                        type="email"
                                        placeholder="이메일을 입력해주세요"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={otpStep === 2}
                                        className="h-14 bg-slate-50 border-none focus-visible:bg-white"
                                    />
                                </div>
                                
                                {otpStep === 1 ? (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="w-full h-14 font-black" 
                                        onClick={handleSendOTP}
                                        isLoading={loading}
                                        disabled={!email}
                                    >
                                        <Mail className="w-4 h-4 mr-2" /> 인증번호 전송
                                    </Button>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">인증번호 (6자리)</label>
                                            <button 
                                                type="button" 
                                                onClick={() => setOtpStep(1)}
                                                className="text-[10px] font-black text-primary hover:underline"
                                            >
                                                이메일 변경
                                            </button>
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                            required
                                            className="h-14 bg-slate-50 border-none focus-visible:bg-white text-center text-2xl tracking-[1em] font-black"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {error && (
                            <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-3 rounded-2xl">
                                {error}
                            </p>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full h-14 text-base font-black shadow-premium" 
                            isLoading={loading}
                            disabled={otpStep === 1}
                        >
                            로그인 <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                    </form>
                </Card>
                <p className="text-center mt-10 text-[10px] text-slate-300 font-black tracking-widest uppercase">
                    © 2024 3Monster Series. Secured by Cloud Shield.
                </p>
            </motion.div>
        </div>
    );
};
