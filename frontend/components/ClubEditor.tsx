'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { api, json } from '@/lib/api';
import { formatDay, formatPrice, possessive } from '@/lib/format';
import type { HostClub, Space } from '@/lib/types';

const MAX_PHOTOS = 10;
const MAX_TAGS = 6;
const MAX_SIZE = 5 * 1024 * 1024;
const DURATIONS = [60, 90, 120, 150, 180, 240];
const STEPS = [
  { en: 'My Mood', ko: '내 무드 설정' },
  { en: 'My Style', ko: '내 미감 자랑하기' },
  { en: 'Curriculum', ko: '4개월 커리큘럼' },
  { en: 'Ticket', ko: '시즌권 설정' },
];
const PLACEHOLDERS = [
  ['웰컴 티타임', '서로의 취향 알아가기'],
  ['스타일 체인지', '나에게 맞는 퍼스널 무드 찾기'],
  ['핫플 투어', '제가 영감받는 장소에 함께 가요'],
  ['프라이빗 와인 파티', '시즌을 마무리하는 작별 인사'],
];

type Photo = { url: string; file?: File };
interface SessionForm {
  title: string;
  description: string;
  durationMinutes: number;
  spaceId: string;
}

const kstMidnight = (ymd: string) => new Date(`${ymd}T00:00:00+09:00`);
const toKstYmd = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10);
const tomorrowYmd = () => toKstYmd(new Date(Date.now() + 86400_000).toISOString());

/**
 * 클럽 편집기
 * - open: 4단계 마법사로 새 시즌 오픈 (클럽 프로필도 함께 저장)
 * - edit: 클럽 페이지(프로필) + 진행 중/모집 중 시즌 수정. 탭으로 자유롭게 이동하며 언제든 저장
 */
export default function ClubEditor({ mode, club }: { mode: 'open' | 'edit'; club: HostClub | null }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: moodTags } = useSWR<string[]>('/mood-tags');
  const { data: spaces } = useSWR<Space[]>('/spaces');

  const latest = club?.seasons[0];
  const isEdit = mode === 'edit';
  /** edit 모드에서 수정할 시즌 (종료되지 않은 최신 시즌) */
  const editSeason = isEdit && latest && latest.phase !== 'ENDED' ? latest : null;
  /** 커리큘럼/티켓 초기값 출처 */
  const source = isEdit ? editSeason : latest;
  const hasSeasonSteps = !isEdit || !!editSeason;
  const stepCount = hasSeasonSteps ? 4 : 3;
  const seasonNumber = isEdit ? editSeason?.number : (latest?.number ?? 0) + 1;

  const started = !!editSeason && (editSeason.phase === 'IN_PROGRESS');
  const priceLocked = started || (!!editSeason && editSeason.appliedCount > 0);

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState(club?.displayName ?? '');
  const [tags, setTags] = useState<string[]>(club?.moodTags ?? []);
  const [customTag, setCustomTag] = useState('');
  const [intro, setIntro] = useState(club?.intro ?? '');
  const [followers, setFollowers] = useState(club?.instagramFollowers?.toString() ?? '');
  // Step 2
  const [photos, setPhotos] = useState<Photo[]>((club?.gallery ?? []).map((url) => ({ url })));
  // Step 3
  const [sessions, setSessions] = useState<SessionForm[]>(
    [0, 1, 2, 3].map((i) => {
      const prev = source?.sessions[i];
      return {
        title: prev?.title ?? '',
        description: prev?.description ?? '',
        durationMinutes: prev?.durationMinutes ?? 120,
        spaceId: prev?.spaceId ?? '',
      };
    }),
  );
  const [benefits, setBenefits] = useState<string[]>(club?.benefits.length ? club.benefits : ['', '', '']);
  // Step 4
  const [price, setPrice] = useState(source?.price.toString() ?? '200000');
  const [capacity, setCapacity] = useState(source?.maxCapacity.toString() ?? '10');
  const [startDate, setStartDate] = useState(editSeason ? toKstYmd(editSeason.startDate) : '');
  const [openChatUrl, setOpenChatUrl] = useState(source?.openChatUrl ?? '');

  // 새로 고른 사진 미리보기 URL은 언마운트 시 해제
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url)), []);

  const touch = () => setSaved(false);

  const toggleTag = (t: string) => {
    touch();
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= MAX_TAGS ? cur : [...cur, t]));
  };
  const addCustomTag = () => {
    const t = customTag.trim().replace(/^#/, '').replace(/\s+/g, '');
    if (t && !tags.includes(t) && tags.length < MAX_TAGS) setTags([...tags, t]);
    setCustomTag('');
    touch();
  };

  const pickPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.some((f) => f.size > MAX_SIZE)) alert('5MB를 넘는 사진은 제외했어요.');
    const ok = files.filter((f) => f.size <= MAX_SIZE).slice(0, MAX_PHOTOS - photos.length);
    setPhotos([...photos, ...ok.map((file) => ({ url: URL.createObjectURL(file), file }))]);
    touch();
  };
  const removePhoto = (i: number) => {
    if (photos[i].file) URL.revokeObjectURL(photos[i].url);
    setPhotos(photos.filter((_, j) => j !== i));
    touch();
  };
  const movePhoto = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    setPhotos(next);
    touch();
  };

  const setSession = (i: number, patch: Partial<SessionForm>) => {
    setSessions(sessions.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    touch();
  };

  const validate = (s: number): string => {
    if (s === 0) {
      if (!displayName.trim()) return '클럽에 표시될 이름을 입력해주세요.';
      if (!tags.length) return '나를 나타내는 무드 태그를 1개 이상 골라주세요.';
      if (!intro.trim()) return '짧은 소개 글을 적어주세요.';
    }
    if (s === 1 && !photos.length) return '사진을 1장 이상 올려주세요.';
    if (s === 2 && hasSeasonSteps && sessions.some((x) => !x.title.trim())) return '1~4회차 만남 주제를 모두 입력해주세요.';
    if (s === 3 && hasSeasonSteps) {
      if (price === '' || Number(price) < 0) return '시즌권 가격을 입력해주세요.';
      if (!capacity || Number(capacity) < 1) return '최대 모집 인원을 입력해주세요.';
      if (!startDate) return '시즌 시작일을 선택해주세요.';
      const changed = !editSeason || startDate !== toKstYmd(editSeason.startDate);
      if (changed && kstMidnight(startDate).getTime() <= Date.now()) return '시즌 시작일은 내일 이후로 골라주세요.';
    }
    return '';
  };

  const go = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };
  const next = () => {
    const msg = validate(step);
    setError(msg);
    if (!msg) go(step + 1);
  };

  /** 모든 단계 검사. 실패하면 해당 단계로 이동 */
  const validateAll = () => {
    for (let s = 0; s < stepCount; s++) {
      const msg = validate(s);
      if (msg) {
        setError(msg);
        go(s);
        return false;
      }
    }
    setError('');
    return true;
  };

  const uploadGallery = async () => {
    const files = photos.filter((p) => p.file);
    if (!files.length) return photos.map((p) => p.url);
    const fd = new FormData();
    files.forEach((p) => fd.append('files', p.file!));
    const { urls } = await api<{ urls: string[] }>('/uploads/images', { method: 'POST', body: fd });
    let k = 0;
    const gallery = photos.map((p) => (p.file ? urls[k++] : p.url));
    // 업로드 완료된 사진은 URL로 교체 (재저장 시 중복 업로드 방지)
    photos.forEach((p) => p.file && URL.revokeObjectURL(p.url));
    setPhotos(gallery.map((url) => ({ url })));
    return gallery;
  };

  const seasonPayload = () => ({
    sessions: sessions.map((s) => ({
      title: s.title,
      description: s.description || undefined,
      durationMinutes: s.durationMinutes,
      spaceId: s.spaceId || undefined,
    })),
    price: Number(price),
    maxCapacity: Number(capacity),
    startDate:
      editSeason && startDate === toKstYmd(editSeason.startDate) ? editSeason.startDate : kstMidnight(startDate).toISOString(),
    openChatUrl: openChatUrl || undefined,
  });

  const save = async () => {
    if (!validateAll()) return;
    setSaving(true);
    try {
      const gallery = await uploadGallery();
      const profile = {
        displayName,
        moodTags: tags,
        intro,
        instagramFollowers: followers ? Number(followers) : undefined,
        gallery,
        benefits: benefits.filter((b) => b.trim()),
      };

      if (isEdit) {
        await api('/host/club', { method: 'PATCH', ...json(profile) });
        if (editSeason) await api(`/host/seasons/${editSeason.id}`, { method: 'PATCH', ...json(seasonPayload()) });
        await mutate('/host/club');
        if (club) await mutate(`/clubs/${club.id}`);
        setSaved(true);
        setSaving(false);
      } else {
        const season = await api<{ club: { id: string } }>('/host/seasons', {
          method: 'POST',
          ...json({ profile, season: seasonPayload() }),
        });
        await mutate('/host/club');
        router.push(`/clubs/${season.club.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했어요.');
      setSaving(false);
    }
  };

  const endPreview = startDate
    ? (() => {
        const d = kstMidnight(startDate);
        d.setMonth(d.getMonth() + 4);
        return d.toISOString();
      })()
    : null;

  const visibleSteps = STEPS.slice(0, stepCount);

  return (
    <div className="container-app pt-8">
      {/* 헤더 */}
      {isEdit ? (
        <>
          <p className="eyebrow">Edit My Club</p>
          <h1 className="mt-2 font-serif text-2xl font-medium">클럽 페이지 수정</h1>
          <p className="mt-1 text-xs text-muted">
            {editSeason ? `클럽 프로필과 시즌 ${editSeason.number} 내용을 수정해요.` : '클럽 프로필을 수정해요. (진행 중인 시즌이 없어요)'}
          </p>
          <nav className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5">
            {visibleSteps.map((s, i) => (
              <button
                key={s.en}
                type="button"
                onClick={() => go(i)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] transition ${
                  i === step ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-ink-soft hover:border-ink/50'
                }`}
              >
                {s.ko}
              </button>
            ))}
          </nav>
        </>
      ) : (
        <>
          <p className="eyebrow">Season {seasonNumber} Open</p>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.en}
                type="button"
                onClick={() => i < step && go(i)}
                className={`h-1 rounded-full transition ${i <= step ? 'bg-ink' : 'bg-line'}`}
                aria-label={s.ko}
              />
            ))}
          </div>
          <div className="mt-6">
            <p className="font-display text-lg italic text-muted">
              Step {step + 1}. {STEPS[step].en}
            </p>
            <h1 className="mt-1 font-serif text-2xl font-medium">{STEPS[step].ko}</h1>
          </div>
        </>
      )}

      <div className="mt-8 space-y-6">
        {step === 0 && (
          <>
            <Field
              label="클럽에 표시될 이름"
              hint={displayName ? `"${possessive(displayName)} Private Club"으로 보여져요.` : '영문 닉네임을 추천해요. 예) Jisu'}
            >
              <input
                className="input"
                value={displayName}
                onChange={(e) => (setDisplayName(e.target.value), touch())}
                maxLength={30}
                placeholder="Jisu"
              />
            </Field>

            <div>
              <span className="label">
                나를 나타내는 무드 <span className="font-normal text-muted">({tags.length}/{MAX_TAGS})</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...(moodTags ?? []), ...tags])].map((t) => {
                  const on = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                        on ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-ink-soft hover:border-ink/50'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="input"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  maxLength={15}
                  placeholder="직접 입력 (예: 발레코어)"
                />
                <button type="button" className="btn-outline shrink-0" onClick={addCustomTag}>
                  추가
                </button>
              </div>
            </div>

            <Field label="나의 미감 소개" hint="클럽 페이지에 인용구처럼 크게 보여져요.">
              <textarea
                className="input min-h-[160px] leading-relaxed"
                value={intro}
                onChange={(e) => (setIntro(e.target.value), touch())}
                maxLength={1000}
                placeholder={'저는 이런 분위기와 라이프스타일을 사랑해요.\n예) 힘을 뺀 듯 단정한 옷차림, 오후 네 시의 햇살...'}
              />
            </Field>

            <Field label="인스타그램 팔로워 수 (선택)" hint="클럽 페이지 상단에 신뢰도 표시로 보여져요.">
              <input
                className="input"
                type="number"
                min={0}
                value={followers}
                onChange={(e) => (setFollowers(e.target.value), touch())}
                placeholder="128000"
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm leading-relaxed text-muted">
              가장 자신 있는 스타일링·라이프스타일 사진을 올려주세요. <b className="text-ink">첫 번째 사진이 메인 커버</b>로 쓰여요.
              <br />
              세로 사진(3:4)이 가장 예쁘게 보여요.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p, i) => (
                <div key={p.url} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-ivory-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] text-ivory">커버</span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent pt-4 text-xs text-white">
                    <button type="button" className="px-2.5 py-1.5" onClick={() => movePhoto(i, -1)} aria-label="앞으로">
                      ‹
                    </button>
                    <button type="button" className="px-2.5 py-1.5" onClick={() => removePhoto(i)} aria-label="삭제">
                      ✕
                    </button>
                    <button type="button" className="px-2.5 py-1.5" onClick={() => movePhoto(i, 1)} aria-label="뒤로">
                      ›
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/25 text-muted transition hover:border-ink">
                  <span className="text-2xl font-light">+</span>
                  <span className="text-xs">
                    사진 추가 ({photos.length}/{MAX_PHOTOS})
                  </span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={pickPhotos} />
                </label>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {hasSeasonSteps && (
              <>
                <p className="text-sm text-muted">한 달에 한 번, 총 4번의 만남을 설계해주세요.</p>
                {sessions.map((s, i) => (
                  <div key={i} className="card space-y-3 p-5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl italic text-accent">{i + 1}</span>
                      <span className="text-sm font-medium">{i + 1}개월 차</span>
                    </div>
                    <input
                      className="input"
                      value={s.title}
                      onChange={(e) => setSession(i, { title: e.target.value })}
                      maxLength={60}
                      placeholder={`만남 주제 (예: ${PLACEHOLDERS[i][0]})`}
                    />
                    <input
                      className="input"
                      value={s.description}
                      onChange={(e) => setSession(i, { description: e.target.value })}
                      maxLength={300}
                      placeholder={`한 줄 설명 (예: ${PLACEHOLDERS[i][1]})`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="input"
                        value={s.durationMinutes}
                        onChange={(e) => setSession(i, { durationMinutes: Number(e.target.value) })}
                      >
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>
                            약 {d >= 60 ? `${d / 60}시간` : `${d}분`}
                          </option>
                        ))}
                      </select>
                      <select className="input" value={s.spaceId} onChange={(e) => setSession(i, { spaceId: e.target.value })}>
                        <option value="">장소 미정</option>
                        {spaces?.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} ({sp.priceCondition})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted">
                  제휴 공간을 고르면 관리자가 확인 후 대관을 확정해드려요.
                  {isEdit && ' 장소를 바꾸면 대관을 다시 요청하게 돼요.'}
                </p>
              </>
            )}

            <div className={hasSeasonSteps ? 'pt-4' : ''}>
              <span className="label">저와 만나면 이런 걸 얻어갈 수 있어요</span>
              <div className="space-y-2">
                {benefits.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input"
                      value={b}
                      onChange={(e) => (setBenefits(benefits.map((x, j) => (j === i ? e.target.value : x))), touch())}
                      maxLength={60}
                      placeholder={['예) 말투와 애티튜드', '예) 사진 잘 찍는 법', '예) 멘탈 관리법'][i] ?? '얻어갈 수 있는 것'}
                    />
                    <button
                      type="button"
                      className="shrink-0 px-2 text-muted hover:text-ink"
                      onClick={() => (setBenefits(benefits.filter((_, j) => j !== i)), touch())}
                      aria-label="삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {benefits.length < 10 && (
                <button type="button" className="mt-2 text-sm text-accent" onClick={() => setBenefits([...benefits, ''])}>
                  + 항목 추가
                </button>
              )}
            </div>
          </>
        )}

        {step === 3 && hasSeasonSteps && (
          <>
            {isEdit && (started || priceLocked) && (
              <p className="rounded-xl bg-accent-soft p-3 text-xs leading-relaxed text-ink-soft">
                {started
                  ? '시즌이 이미 시작되어 가격·정원·시작일은 바꿀 수 없어요. 단톡방 링크만 수정할 수 있어요.'
                  : `이미 합류 신청한 멤버(${editSeason?.appliedCount}명)가 있어 가격은 바꿀 수 없어요. 정원은 신청 인원 이상으로만 조정할 수 있어요.`}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="시즌권 가격 (4개월)">
                <input
                  className="input disabled:opacity-50"
                  type="number"
                  min={0}
                  step={10000}
                  value={price}
                  disabled={priceLocked}
                  onChange={(e) => (setPrice(e.target.value), touch())}
                />
              </Field>
              <Field label="최대 모집 인원">
                <input
                  className="input disabled:opacity-50"
                  type="number"
                  min={editSeason?.appliedCount || 1}
                  value={capacity}
                  disabled={started}
                  onChange={(e) => (setCapacity(e.target.value), touch())}
                />
              </Field>
            </div>
            <Field
              label="시즌 시작일"
              hint={
                endPreview
                  ? `${formatDay(endPreview)}까지 4개월 동안 진행돼요. 시작일 전까지 멤버를 모집해요.`
                  : '시작일 전까지 멤버를 모집해요.'
              }
            >
              <input
                className="input disabled:opacity-50"
                type="date"
                min={tomorrowYmd()}
                value={startDate}
                disabled={started}
                onChange={(e) => (setStartDate(e.target.value), touch())}
              />
            </Field>
            <Field label="멤버 단톡방 링크 (선택)" hint="입금이 확인된 멤버에게만 공개돼요.">
              <input
                className="input"
                type="url"
                value={openChatUrl}
                onChange={(e) => (setOpenChatUrl(e.target.value), touch())}
                placeholder="https://open.kakao.com/..."
              />
            </Field>

            <div className="rounded-3xl bg-ink p-6 text-ivory">
              <p className="text-[10px] uppercase tracking-label text-ivory/50">Preview</p>
              <p className="mt-1 font-display text-3xl italic">{possessive(displayName || 'My')} Private Club</p>
              <p className="mt-3 text-sm text-ivory/70">시즌권 (4개월, 월 1회 오프라인 만남)</p>
              <p className="font-serif text-xl font-semibold">{price ? formatPrice(Number(price)) : '-'}</p>
            </div>
          </>
        )}

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* 하단 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 backdrop-blur-md">
        {isEdit ? (
          <div className="container-app flex gap-2 py-3">
            {club && (
              <a href={`/clubs/${club.id}`} target="_blank" rel="noreferrer" className="btn-outline px-5 py-3.5">
                미리보기
              </a>
            )}
            <button type="button" className="btn-primary flex-1 py-3.5" onClick={save} disabled={saving}>
              {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장하기'}
            </button>
          </div>
        ) : (
          <div className="container-app flex gap-2 py-3">
            {step > 0 && (
              <button type="button" className="btn-outline px-6 py-3.5" onClick={() => (setError(''), go(step - 1))} disabled={saving}>
                이전
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn-primary flex-1 py-3.5" onClick={next}>
                다음
              </button>
            ) : (
              <button type="button" className="btn-primary flex-1 py-3.5" onClick={save} disabled={saving}>
                {saving ? '시즌 여는 중...' : `시즌 ${seasonNumber} 오픈하기`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
  </label>
);
