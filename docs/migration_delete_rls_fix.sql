-- 🔱 support_tickets 테이블에 삭제(DELETE) RLS 정책 추가
-- - 목적: 본인(작성자) 또는 관리자(admin 역할)만 해당 문의를 삭제할 수 있도록 허용
-- - 실행 방법: Supabase 콘솔 SQL Editor에서 아래 쿼리를 전체 실행하십시오.

DROP POLICY IF EXISTS "Enable delete for owners and admins" ON public.support_tickets;
CREATE POLICY "Enable delete for owners and admins" ON public.support_tickets
    FOR DELETE
    USING (
        auth.uid() = uid 
        OR email IN (SELECT email FROM public.users WHERE users.uid = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.uid = auth.uid() AND users.role = 'admin'
        )
    );
