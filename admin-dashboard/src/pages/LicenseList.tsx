import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Search, Loader2, Trash2, Power, CheckCircle2, Clock, AlertCircle, Pencil, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface License {
    id: string;
    serial_key: string;
    product_id: string;
    buyer_name: string;
    status: 'active' | 'used' | 'unused' | 'expired' | 'blocked';
    expire_date: string;
    created_at: string;
    bound_value?: string;
    price_sold?: number;
    license_type?: string;
    contact?: string;
    memo?: string;
}

interface Toast {
    id: number;
    message: string;
    type?: 'info' | 'success';
}

export const LicenseList = () => {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    let toastId = 0;

    const showToast = (message: string, type: 'info' | 'success' = 'info') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const fetchLicenses = async () => {
        const { data, error } = await supabase
            .from('licenses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching licenses:', error);
        } else {
            setLicenses(data as License[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLicenses();

        const channel = supabase
            .channel('license-list-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, () => {
                fetchLicenses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredLicenses = licenses.filter(license =>
        license.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.serial_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (license.contact && license.contact.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusInfo = (license: License) => {
        const expireDate = license.expire_date ? new Date(license.expire_date) : null;
        const now = new Date();
        const isExpired = expireDate && expireDate < now;

        if (license.status === 'blocked') {
            return { label: '정지', color: 'text-rose-700 bg-rose-50 border border-rose-200/60', icon: AlertCircle };
        }
        if (isExpired) {
            return { label: '만료', color: 'text-slate-550 bg-slate-50 border border-slate-200', icon: AlertCircle };
        }
        if (expireDate && (license.status === 'active' || license.status === 'used')) {
            const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 7) {
                return { label: '만료 예정', color: 'text-orange-700 bg-orange-50 border border-orange-200/60', icon: Clock };
            }
        }
        switch (license.status) {
            case 'active':
            case 'used':
                return { label: '사용중', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/60', icon: CheckCircle2 };
            case 'unused':
                return { label: '대기중', color: 'text-indigo-700 bg-indigo-50 border border-indigo-200/60', icon: Clock };
            default:
                return { label: '사용중', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/60', icon: CheckCircle2 };
        }
    };

    const getLicenseTypeBadge = (licenseType: string) => {
        switch (licenseType) {
            case 'TRIAL':
                return { label: 'DELUXE (체험판)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' };
            case '1M':
                return { label: 'STANDARD (1개월)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' };
            case '3M':
                return { label: 'PREMIUM (3개월)', color: 'bg-purple-50 text-purple-700 border-purple-200/80' };
            case '6M':
                return { label: 'STANDARD (6개월)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' };
            case 'LIFETIME':
                return { label: 'PREMIUM (영구)', color: 'bg-purple-50 text-purple-700 border-purple-200/80' };
            default:
                return { label: licenseType || '기타', color: 'bg-slate-50 text-slate-700 border-slate-200' };
        }
    };

    const handleCopySerial = (serial: string) => {
        navigator.clipboard.writeText(serial).then(() => {
            showToast(`복사됨: ${serial}`, 'success');
        });
    };

    const handleShowMemo = (memo: string) => {
        showToast(memo, 'info');
    };

    const handleDeleteLicense = async (id: string, buyerName: string) => {
        if (!window.confirm(`"${buyerName}" 구매자의 라이선스를 완전히 삭제하시겠습니까?`)) return;
        try {
            const { error } = await supabase.from('licenses').delete().eq('id', id);
            if (error) throw error;
            fetchLicenses();
        } catch (error: any) {
            alert(`삭제 중 오류: ${error.message}`);
        }
    };

    const handleEditExpireDate = async (id: string, currentExpire: string, buyerName: string) => {
        const newDate = window.prompt(`"${buyerName}"의 새 만료일자 (YYYY-MM-DD):`, currentExpire ? currentExpire.split('T')[0] : '');
        if (!newDate) return;
        const parsedDate = new Date(newDate);
        if (isNaN(parsedDate.getTime())) { alert('날짜 형식 오류 (YYYY-MM-DD)'); return; }
        try {
            const { error } = await supabase.from('licenses').update({ expire_date: parsedDate.toISOString() }).eq('id', id);
            if (error) throw error;
            fetchLicenses();
            showToast(`만료일자 변경: ${newDate}`, 'success');
        } catch (error: any) {
            alert(`수정 오류: ${error.message}`);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string, buyerName: string) => {
        const isBlocked = currentStatus === 'blocked';
        if (isBlocked) {
            if (!window.confirm(`"${buyerName}" 차단을 해제하시겠습니까?`)) return;
            try {
                const { error } = await supabase.from('licenses').update({ status: 'active' }).eq('id', id);
                if (error) throw error;
                fetchLicenses();
            } catch (err: any) { alert(err.message); }
        } else {
            const reason = window.prompt(`"${buyerName}" 차단 사유:`, '');
            if (reason === null) return;
            try {
                const { data: licData } = await supabase.from('licenses').select('memo').eq('id', id).single();
                const currentMemo = licData?.memo || '';
                const appendText = reason ? `\n[차단사유: ${reason}]` : '\n[차단사유: 미입력]';
                const { error } = await supabase.from('licenses').update({ status: 'blocked', memo: currentMemo + appendText }).eq('id', id);
                if (error) throw error;
                fetchLicenses();
            } catch (err: any) { alert(err.message); }
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Toast container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={cn(
                        "px-4 py-3 rounded-xl shadow-xl text-sm font-bold max-w-xs animate-in slide-in-from-bottom-2 fade-in duration-200",
                        t.type === 'success'
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-900 text-white"
                    )}>
                        {t.message}
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">구매자 관리</h1>
                <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="ID / 이메일 / 시리얼 검색"
                        className="pl-11 bg-white border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm font-bold rounded-xl h-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="overflow-hidden p-0 border border-slate-200 shadow-[0_15px_45px_rgba(0,0,0,0.07)] rounded-2xl bg-white">
                <table className="w-full">
                    <thead className="bg-slate-900 text-white">
                        <tr className="text-xs font-black uppercase tracking-wider text-left">
                            <th className="px-4 py-2.5 text-slate-200">구매자 ID / 이메일</th>
                            <th className="px-4 py-2.5 text-slate-200">제품 / 시리얼</th>
                            <th className="px-4 py-2.5 text-slate-200">구매일자</th>
                            <th className="px-4 py-2.5 text-slate-200">만료일자</th>
                            <th className="px-4 py-2.5 text-slate-200">상태</th>
                            <th className="px-4 py-2.5 text-right text-slate-200">제어</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-200" /></td></tr>
                        ) : filteredLicenses.map((lic) => {
                            const status = getStatusInfo(lic);
                            const pkgBadge = getLicenseTypeBadge(lic.license_type || '');
                            return (
                                <tr key={lic.id} className="hover:bg-slate-50/60 transition-colors">
                                    {/* 구매자 ID / 이메일 */}
                                    <td className="px-4 py-2 font-bold text-slate-800">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm">{lic.buyer_name}</span>
                                            {lic.contact && (
                                                <span className="text-[11px] text-slate-500 font-medium">{lic.contact}</span>
                                            )}
                                            {lic.memo && (
                                                <button
                                                    className="text-left text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-colors w-fit font-semibold"
                                                    onClick={() => handleShowMemo(lic.memo!)}
                                                >
                                                    📝 메모
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* 제품 / 시리얼 */}
                                    <td className="px-4 py-2">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-slate-700">{lic.product_id}</span>
                                                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider", pkgBadge.color)}>
                                                    {pkgBadge.label}
                                                </span>
                                            </div>
                                            <button
                                                className="flex items-center gap-1 text-[10px] font-mono text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 px-2 py-0.5 rounded border border-slate-200 hover:border-indigo-200 transition-colors w-fit"
                                                onClick={() => handleCopySerial(lic.serial_key)}
                                                title="클릭하여 복사"
                                            >
                                                <Copy className="w-2.5 h-2.5" />
                                                {lic.serial_key}
                                            </button>
                                        </div>
                                    </td>

                                    {/* 구매일자 */}
                                    <td className="px-4 py-2 text-xs font-bold text-slate-500">
                                        {lic.created_at ? format(new Date(lic.created_at), 'yyyy.MM.dd') : '-'}
                                    </td>

                                    {/* 만료일자 */}
                                    <td className="px-4 py-2 text-xs font-bold text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <span>{lic.expire_date ? format(new Date(lic.expire_date), 'yyyy.MM.dd') : '-'}</span>
                                            <button
                                                className="text-slate-300 hover:text-indigo-500 transition-colors"
                                                onClick={() => handleEditExpireDate(lic.id, lic.expire_date, lic.buyer_name)}
                                                title="만료일자 수정"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>

                                    {/* 상태 */}
                                    <td className="px-4 py-2">
                                        <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black border", status.color)}>
                                            <status.icon className="w-3 h-3" /> {status.label}
                                        </div>
                                    </td>

                                    {/* 제어 */}
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex justify-end gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-7 w-7 transition-colors",
                                                    lic.status === 'blocked'
                                                        ? "text-emerald-600 hover:bg-emerald-50"
                                                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                )}
                                                onClick={() => handleToggleStatus(lic.id, lic.status, lic.buyer_name)}
                                                title={lic.status === 'blocked' ? "정지 해제" : "라이선스 정지"}
                                            >
                                                <Power className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                onClick={() => handleDeleteLicense(lic.id, lic.buyer_name)}
                                                title="라이선스 삭제"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && filteredLicenses.length === 0 && (
                            <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-sm">검색 결과가 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};
