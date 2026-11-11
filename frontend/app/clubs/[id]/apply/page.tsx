'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import RequireRole from '@/components/RequireRole';
import { Empty, Spinner } from '@/components/States';
import { api, json } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { formatDay, formatPrice, possessive } from '@/lib/format';
import type { AppConfig, ClubDetail } from '@/lib/types';

export default function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireRole role="USER">
      <ApplyForm id={id} />
    </RequireRole>
  );
}

type Field = 'applicantName' | 'contact' | 'instagramId';

function validate(form: Record<Field, string>): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!form.applicantName.trim()) errors.applicantName = '이름을 입력해주세요.';
  const phone = form.contact.replace(/[^0-9]/g, '');
  if (!phone) errors.contact = '연락처를 입력해주세요.';
  else if (!/^01[016789][0-9]{7,8}$/.test(phone)) errors.contact = '올바른 휴대폰 번호를 입력해주세요.';
  const insta = form.instagramId.trim().replace(/^@/, '');
  if (!insta) errors.instagramId = '인스타그램 ID를 입력해주세요.';
  else if (!/^[A-Za-z0-9._]{1,30}$/.test(insta)) errors.instagramId = '영문, 숫자, 마침표(.), 밑줄(_)만 사용할 수 있어요.';
  return errors;
}

function ApplyForm({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useMe();
  const { data: c, isLoading } = useSWR<ClubDetail>(`/clubs/${id}`);
  const { data: config } = useSWR<AppConfig>('/config');
  const [form, setForm] = useState<Record<Field, string>>({ applicantName: '', contact: '', instagramId: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, applicantName: f.applicantName || user.name, instagramId: f.instagramId || (user.instagramId ?? '') }));
  }, [user]);

  useEffect(() => {
    if (c?.myOrder) router.replace('/mypage');
  }, [c, router]);

  if (isLoading) return <Spinner />;
  const season = c?.season;
  if (!c || !season) return <Empty>클럽을 찾을 수 없어요.</Empty>;
  if (season.phase !== 'RECRUITING') return <Empty>지금은 멤버를 모집하고 있지 않아요.</Empty>;

  const bank = config?.bank;
  const accountText = bank ? `${bank.name} ${bank.accountNumber} ${bank.holder}` : '';

  const copy = async () => {
    if (!bank) return;
    await navigator.clipboard.writeText(bank.accountNumber.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    try {
      await api(`/seasons/${season.id}/orders`, { method: 'POST', ...json(form) });
      router.push('/mypage?applied=1');
    } catch (err) {
      alert(err instanceof Error ? err.message : '합류 신청에 실패했습니다.');
      setSubmitting(false);
    }
  };

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="container-app space-y-10 pt-8" noValidate>
      <div>
        <p className="eyebrow">Join the club</p>
        <h1 className="mt-2 font-serif text-2xl font-medium">멤버십 합류 신청</h1>
      </div>

      {/* 최종 확인 */}
      <section className="flex gap-4 overflow-hidden rounded-3xl bg-ink p-4 text-ivory">
        <div className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl bg-ink-soft">
          {c.gallery[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.gallery[0]} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center py-1">
          <p className="text-[10px] uppercase tracking-label text-ivory/50">Season {season.number} · 4 months</p>
          <p className="mt-1 truncate font-display text-[28px] italic leading-none">{possessive(c.displayName)} Private Club</p>
          <p className="mt-2 text-xs text-ivory/60">
            {formatDay(season.startDate)} 시작 · 월 1회 · 총 4회
          </p>
          <p className="mt-2 font-serif text-xl font-semibold">{formatPrice(season.price)}</p>
        </div>
      </section>

      {/* 팬 인증 */}
      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-lg font-medium">멤버 정보</h2>
          <p className="mt-1 text-xs text-muted">{c.displayName}님이 시즌 전에 멤버들을 미리 알아볼 수 있도록 정확하게 적어주세요.</p>
        </div>
        <FormField label="이름" error={errors.applicantName}>
          <input className="input" value={form.applicantName} onChange={set('applicantName')} placeholder="실명 (입금자명과 동일하게)" />
        </FormField>
        <FormField label="연락처" error={errors.contact}>
          <input className="input" type="tel" inputMode="numeric" value={form.contact} onChange={set('contact')} placeholder="010-1234-5678" />
        </FormField>
        <FormField label="내 인스타그램 ID" error={errors.instagramId} hint="노쇼 방지와 본인 확인에 사용돼요.">
          <input className="input" value={form.instagramId} onChange={set('instagramId')} placeholder="@instagram_id" autoCapitalize="off" />
        </FormField>
      </section>

      {/* 결제 안내 */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-medium">무통장 입금</h2>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs text-muted">입금 계좌</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="font-medium">{accountText || '불러오는 중...'}</p>
            <button type="button" onClick={copy} className="btn-outline btn-sm shrink-0">
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm text-muted">입금 금액 (4개월 시즌권)</span>
            <span className="font-serif text-lg font-semibold">{formatPrice(season.price)}</span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          입금 후 아래 버튼을 눌러주세요. 관리자가 입금을 확인하면 시즌 {season.number} 멤버로 확정돼요.
          <br />
          입금자명은 신청자 이름과 같게 해주세요.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 backdrop-blur-md">
        <div className="container-app py-3">
          <button type="submit" className="btn-primary w-full py-3.5" disabled={submitting}>
            {submitting ? '신청 중...' : '입금 완료 및 합류하기'}
          </button>
        </div>
      </div>
    </form>
  );
}

function FormField({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </label>
  );
}
