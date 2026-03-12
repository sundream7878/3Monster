import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';

export const CustomerSupport = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    const [contactEmail, setContactEmail] = useState(localStorage.getItem('buyer_email') || '');
    const [issueType, setIssueType] = useState('bug');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [logFile, setLogFile] = useState<File | null>(null);

    const handleUploadFile = async (file: File, folder: string): Promise<string> => {
        if (!user) throw new Error('Not authenticated');
        const fileRef = ref(storage, `support/${user.uid}/${folder}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytesResumable(fileRef, file);
        return getDownloadURL(snapshot.ref);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            let imageUrl = null;
            let logUrl = null;

            if (imageFile) imageUrl = await handleUploadFile(imageFile, 'images');
            if (logFile) logUrl = await handleUploadFile(logFile, 'logs');

            await addDoc(collection(db, 'support_tickets'), {
                uid: user.uid,
                email: contactEmail,
                issueType,
                description,
                imageUrl,
                logUrl,
                status: 'open',
                createdAt: serverTimestamp(),
            });

            setSuccess(true);
            setDescription('');
            setImageFile(null);
            setLogFile(null);
        } catch (err: any) {
            console.error("Error submitting ticket:", err);
            setError(`문의 접수 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">고객센터</h1>
                <p className="text-slate-400 font-medium">서비스 이용 중 불편하신 점이나 문의사항을 접수해주세요.</p>
            </div>

            <Card className="overflow-hidden p-0 shadow-premium border-none rounded-[2.5rem]">
                <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-xl">문의 접수하기</CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                    {success && (
                        <div className="mb-8 flex items-center gap-4 bg-emerald-50 text-emerald-600 p-6 rounded-2xl">
                            <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-lg">성공적으로 접수되었습니다.</h4>
                                <p className="text-sm font-medium opacity-80 mt-1">
                                    담당자가 확인 후 입력하신 이메일로 답변을 드리겠습니다.
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-8 flex items-center gap-4 bg-red-50 text-red-600 p-6 rounded-2xl">
                            <AlertCircle className="w-8 h-8 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-lg">오류가 발생했습니다.</h4>
                                <p className="text-sm font-medium opacity-80 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">답변받을 이메일</label>
                                <Input
                                    required
                                    type="email"
                                    value={contactEmail}
                                    onChange={e => setContactEmail(e.target.value)}
                                    className="h-14 bg-slate-100/50"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">문의 유형</label>
                                <select
                                    className="w-full h-14 rounded-2xl bg-slate-100/50 px-5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    value={issueType}
                                    onChange={e => setIssueType(e.target.value)}
                                >
                                    <option value="bug">버그/오류 신고</option>
                                    <option value="feature">기능 제안/문의</option>
                                    <option value="license">라이선스 관련</option>
                                    <option value="other">기타</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">상세 증상 및 내용</label>
                            <textarea
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="문제 상황이나 증상을 최대한 자세히 적어주세요."
                                className="w-full min-h-[160px] rounded-2xl bg-slate-100/50 p-5 text-sm font-medium border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                            {/* Image Upload */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5" /> 스크린샷 (선택)
                                </label>
                                <div className="relative h-14 w-full rounded-2xl bg-slate-100/50 flex items-center px-4 overflow-hidden border border-dashed border-slate-300 hover:bg-slate-100 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-500 truncate w-full flex items-center gap-2">
                                        {imageFile ? <span className="text-slate-800">{imageFile.name}</span> : <span>이미지 파일 선택 (.png, .jpg)</span>}
                                    </span>
                                </div>
                            </div>

                            {/* Log File Upload */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" /> 로그 파일 (선택)
                                </label>
                                <div className="relative h-14 w-full rounded-2xl bg-slate-100/50 flex items-center px-4 overflow-hidden border border-dashed border-slate-300 hover:bg-slate-100 transition-colors">
                                    <input
                                        type="file"
                                        accept=".txt,.log"
                                        onChange={e => setLogFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-500 truncate w-full flex items-center gap-2">
                                        {logFile ? <span className="text-slate-800">{logFile.name}</span> : <span>로그 파일 선택 (.txt, .log)</span>}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-14 text-white font-black text-base mt-4 shadow-premium" isLoading={loading}>
                            <UploadCloud className="mr-2 w-5 h-5" /> 문의 접수하기
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
