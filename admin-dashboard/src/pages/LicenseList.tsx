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
            return { label: '정지', color: 'text-rose-600 bg-rose-50', icon: AlertCircle };
        }

        if (isExpired) {
            return { label: '만료', color: 'text-slate-400 bg-slate-50', icon: AlertCircle };
        }

        // Check for "Expiring Soon" (within 7 days)
        if (expireDate && (license.status === 'active' || license.status === 'used')) {
            const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 7) {
                return { label: '만료 예정', color: 'text-orange-600 bg-orange-50', icon: Clock };
            }
        }

        switch (license.status) {
            case 'active':
            case 'used':
                return { label: '사용중', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 };
            case 'unused':
                return { label: '대기중', color: 'text-indigo-600 bg-indigo-50', icon: Clock };
            default:
                return { label: '사용중', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 };
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">전체 라이선스 관리</h1>
                    <p className="text-slate-400 font-medium">현재 발행된 모든 제품의 활성화 상태를 관리합니다.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative w-80">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="구매자 또는 시리얼 검색"
                            className="pl-12 bg-white h-14"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden p-0 border-none">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                            <th className="px-10 py-5">구매자 성함</th>
                            <th className="px-10 py-5">제품 / 시리얼</th>
                            <th className="px-10 py-5">만료일자</th>
                            <th className="px-10 py-5">상태</th>
                            <th className="px-10 py-5 text-right">제어</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-200" /></td></tr>
                        ) : filteredLicenses.map((lic) => {
                            const status = getStatusInfo(lic);
                            return (
                                <tr key={lic.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6 font-black text-slate-800">{lic.buyer_name}</td>
                                    <td className="px-10 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600">{lic.product_id}</p>
                                            <p className="text-[10px] font-mono text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded w-fit">{lic.serial_key}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-slate-500">
                                        {lic.expire_date ? format(new Date(lic.expire_date), 'yyyy.MM.dd') : '-'}
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black", status.color)}>
                                            <status.icon className="w-3 h-3" /> {status.label}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-slate-100"><Power className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-300 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="w-4 h-4" /></Button>
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

