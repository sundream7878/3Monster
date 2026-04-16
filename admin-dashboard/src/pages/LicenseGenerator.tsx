import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Copy, Key, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const generateSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `CM-${segment()}-${segment()}-${segment()}`;
};

export const LicenseGenerator = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [generatedKey, setGeneratedKey] = useState('');
    const [formData, setFormData] = useState({
        product_id: 'PlaceDB',
        license_type: '1M',
        constraint_type: 'HWID',
        buyer_name: '',
        contact: '',
        channel: '',
        price_sold: '',
        memo: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const isTest = formData.license_type === 'TEST';
        const serial = isTest
            ? `TEST-${generateSerial().split('-').slice(1).join('-')}`
            : generateSerial();

        setGeneratedKey(serial);

        try {
            const now = new Date();
            const expireDate = new Date();
            let collectionLimit = null;

            if (formData.license_type === 'TEST') {
                expireDate.setDate(now.getDate() + 1);
                collectionLimit = 100;
            } else if (formData.license_type === '1M') expireDate.setMonth(now.getMonth() + 1);
            else if (formData.license_type === '3M') expireDate.setMonth(now.getMonth() + 3);
            else if (formData.license_type === '6M') expireDate.setMonth(now.getMonth() + 6);
            else if (formData.license_type === '1Y') expireDate.setFullYear(now.getFullYear() + 1);
            else if (formData.license_type === 'LIFETIME') expireDate.setFullYear(now.getFullYear() + 99);

            const { error } = await supabase
                .from('licenses')
                .insert([{
                    ...formData,
                    buyer_name: isTest ? `${formData.buyer_name} (TEST)` : formData.buyer_name,
                    serial_key: serial,
                    expire_date: expireDate.toISOString(),
                    collection_limit: collectionLimit,
                    status: 'unused',
                    bound_value: null,
                    price_sold: Number(formData.price_sold) || 0
                }]);

            if (error) throw error;

        } catch (error: any) {
            console.error("Error creating license:", error);
            alert(`발행 중 오류가 발생했습니다: ${error.message}\n(UID: ${user?.id || 'Not Logged In'})\n관리자에게 문의하거나 Supabase 설정을 확인해주세요.`);
            setGeneratedKey('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">신규 라이선스 생성</h1>
                <p className="text-slate-400 font-medium">구매자 정보를 입력하고 제품 인증키를 즉시 발행합니다.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <Card className="lg:col-span-8 p-0 overflow-hidden">
                    <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                        <CardTitle className="text-xl">라이선스 정보 입력</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">대상 제품</label>
                                    <select
                                        className="w-full h-14 rounded-2xl bg-slate-100/50 px-5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        value={formData.product_id}
                                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                    >
                                        <option value="PlaceDB">🏢 PlaceDB</option>
                                        <option value="CafeCrawler">☕ CafeCrawler</option>
                                        <option value="StealthComment">🤫 StealthComment</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">이용 기간</label>
                                    <select
                                        className="w-full h-14 rounded-2xl bg-slate-100/50 px-5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        value={formData.license_type}
                                        onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                                    >
                                        <option value="1M">1개월</option>
                                        <option value="3M">3개월</option>
                                        <option value="6M">6개월</option>
                                        <option value="1Y">1년</option>
                                        <option value="LIFETIME">LIFETIME</option>
                                        <option value="TEST">TEST (1일/100건)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">구매자 정보</label>
                                <Input
                                    required
                                    placeholder="구매자 성함 또는 업체명을 입력하세요"
                                    className="h-14 bg-slate-100/50 mb-4"
                                    value={formData.buyer_name}
                                    onChange={e => setFormData({ ...formData, buyer_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <Input placeholder="연락처" className="h-14 bg-slate-100/50" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                                <Input placeholder="판매 가격 (KRW)" className="h-14 bg-slate-100/50" value={formData.price_sold} onChange={e => setFormData({ ...formData, price_sold: e.target.value })} />
                            </div>

                            <Button type="submit" className="w-full h-14 text-white font-black text-base" isLoading={loading}>
                                라이선스 즉시 발행하기 <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="lg:col-span-4 space-y-6">
                    <AnimatePresence>
                        {generatedKey && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <Card className={`${generatedKey.startsWith('TEST-') ? 'bg-emerald-600' : 'bg-indigo-600'} text-white p-8 space-y-6 shadow-premium`}>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            {generatedKey.startsWith('TEST-') ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </div>
                                        <h4 className="font-black text-lg">
                                            {generatedKey.startsWith('TEST-') ? '테스트 키 발급 완료' : '정식 라이선스 발급 완료'}
                                        </h4>
                                    </div>
                                    <div className="rounded-2xl bg-white/10 p-5 text-center">
                                        <p className="font-mono text-xl font-black tracking-widest">{generatedKey}</p>
                                    </div>
                                    <Button
                                        onClick={() => { navigator.clipboard.writeText(generatedKey); alert('Copy Success!'); }}
                                        fullWidth
                                        className="bg-white text-slate-900 hover:bg-slate-50 h-14 font-bold"
                                    >
                                        <Copy className="mr-2 h-4 w-4" /> 키 복사하기
                                    </Button>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {!generatedKey && (
                        <Card className="h-full bg-slate-100/50 border-dashed border-2 border-slate-200 shadow-none flex flex-col items-center justify-center p-10 text-center gap-4 min-h-[400px]">
                            <Key className="w-10 h-10 text-slate-300" />
                            <p className="text-slate-400 font-bold text-sm">정보를 입력하고<br />이용 기간을 선택하면<br />인증키가 생성됩니다.</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
