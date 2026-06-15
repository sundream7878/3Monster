import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Search, Loader2, Trash2, Power, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
}

export const LicenseList = () => {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
        license.serial_key.toLowerCase().includes(searchTerm.toLowerCase())
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

        // Check for "Expiring Soon" (within 7 days)
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

    const handleDeleteLicense = async (id: string, buyerName: string) => {
        if (!window.confirm(`"${buyerName}" 구매자의 라이선스를 완전히 삭제하시겠습니까?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('licenses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchLicenses();
        } catch (error: any) {
            console.error('Error deleting license:', error);
            alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string, buyerName: string) => {
        const isBlocked = currentStatus === 'blocked';
        const newStatus = isBlocked ? 'active' : 'blocked';
        const actionLabel = isBlocked ? '차단 해제' : '차단';

        if (!window.confirm(`"${buyerName}" 구매자의 라이선스를 ${actionLabel}하시겠습니까?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('licenses')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchLicenses();
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">구매자 관리</h1>
                </div>
                <div className="flex gap-4">
                    <div className="relative w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="구매자 또는 시리얼 검색"
                            className="pl-11 bg-white border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm font-bold rounded-xl h-12"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden p-0 border border-slate-200 shadow-[0_15px_45px_rgba(0,0,0,0.07)] rounded-2xl bg-white">
                <table className="w-full">
                    <thead className="bg-slate-900 text-white">
                        <tr className="text-sm font-black uppercase tracking-wider text-left">
                            <th className="px-10 py-3 text-slate-200">구매자 성함</th>
                            <th className="px-10 py-3 text-slate-200">제품 / 시리얼</th>
                            <th className="px-10 py-3 text-slate-200">만료일자</th>
                            <th className="px-10 py-3 text-slate-200">상태</th>
                            <th className="px-10 py-3 text-right text-slate-200">제어</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-200" /></td></tr>
                        ) : filteredLicenses.map((lic) => {
                            const status = getStatusInfo(lic);
                            const pkgBadge = getLicenseTypeBadge(lic.license_type || '');
                            return (
                                <tr key={lic.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-1 font-black text-slate-800">{lic.buyer_name}</td>
                                    <td className="px-10 py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-slate-700">{lic.product_id}</span>
                                            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider", pkgBadge.color)}>
                                                {pkgBadge.label}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-700 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-400">{lic.serial_key}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-1 text-sm font-bold text-slate-550">
                                        {lic.expire_date ? format(new Date(lic.expire_date), 'yyyy.MM.dd') : '-'}
                                    </td>
                                    <td className="px-10 py-1">
                                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border", status.color)}>
                                            <status.icon className="w-3 h-3" /> {status.label}
                                        </div>
                                    </td>
                                    <td className="px-10 py-1 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 transition-colors",
                                                    lic.status === 'blocked'
                                                        ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                                )}
                                                onClick={() => handleToggleStatus(lic.id, lic.status, lic.buyer_name)}
                                                title={lic.status === 'blocked' ? "정지 해제" : "라이선스 정지"}
                                            >
                                                <Power className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
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
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

