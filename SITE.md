# 박성은 · 포트폴리오

2026 신입 지원용 포트폴리오 사이트입니다. 빌드 과정이 없는 정적 사이트 — HTML + CSS + JS 한 벌이 전부입니다.

**https://sungeun-portfolio.vercel.app**

---

## 지원 직무별 링크

`?role=` 쿼리 파라미터를 붙이면 상단 대표 프로젝트 3선과 소개 문구가 그 직무에 맞게 바뀝니다.
사이트 안에서 페이지를 옮겨 다녀도 파라미터가 따라다니므로, 채용 공고 하나에 링크 하나를 맞춰 보낼 수 있습니다.

| 용도 | 링크 | 대표 3선 |
|---|---|---|
| 기본 | https://sungeun-portfolio.vercel.app | Bimp · DERO · AWS |
| Product Engineer | https://sungeun-portfolio.vercel.app/?role=product | DERO · 퀴즈 쇼 · Bimp |
| Frontend · UI/UX | https://sungeun-portfolio.vercel.app/?role=fe | DERO · 멍경찰과 냥도둑 · 퀴즈 쇼 |
| Infra · Cloud | https://sungeun-portfolio.vercel.app/?role=infra | AWS · DERO · Lumière |
| Data · AI | https://sungeun-portfolio.vercel.app/?role=data | Bimp · 영화 추천 · 인천 카페 |
| PM · 기획 | https://sungeun-portfolio.vercel.app/?role=pm | DERO · 인천 카페 · Bimp |
| PDF | https://sungeun-portfolio.vercel.app/portfolio.pdf | 10쪽 · 3.8MB |

폴더 3개는 role이 바뀌어도 항상 서로 다른 색을 갖습니다 — 같은 색을 주장하는 프로젝트가 겹치면 남은 색으로 밀어냅니다.

보기 옵션

| | |
|---|---|
| `?plain=1` | 배경 모션과 장식을 끕니다 (저사양 기기 · 화면 녹화용) |
| `?sw=1` | 프로젝트 목록을 강점 축으로 미리 필터링합니다 |

---

## 프로젝트 상세 페이지의 구성

상세 페이지 10개는 모두 같은 순서를 따릅니다. **문제 → 나의 활동 → 성과**입니다 —
결과를 먼저 보여주면 읽는 사람이 그 숫자가 큰지 작은지 판단할 근거가 없기 때문입니다.

개요 탭 안에서

1. `Problem` — 무엇이 문제였나, 근거는 무엇이었나
2. `나의 활동` — 그 안에서 내가 맡은 범위 *(예전에는 별도 탭이었으나 첫 화면에서 보이도록 접어 넣었습니다)*
3. `핵심 성과` — 그래서 무엇이 달라졌나. 가능한 한 `A → B` 형태의 변화량으로

나머지 탭은 `기술 의사결정` · `User Flow` · `아키텍처` · `트러블슈팅` · `회고`이며,
프로젝트가 가진 내용만큼만 렌더됩니다(3~6개).

의사결정 카드가 많은 페이지(DERO)는 판단이 드러나는 5개만 펼쳐두고
나머지는 `기술 선택 N건 더 보기`로 접어두었습니다. 삭제한 내용은 없습니다.

---

## 구조

```
portfolio-site/
├── index.html          # 홈 — 소개, 대표 3선 폴더, 축측투영 타임라인
├── projects.html       # 프로젝트 목록 (강점 축 필터)
├── skills.html         # 기술 스택 (브랜드 SVG 17종 + 모노그램 1종)
├── about.html          # 이력
├── projects/           # 프로젝트 상세 10개
│   ├── vimp.html  dero.html  aws.html  lumiere.html  quiz.html
│   └── cafe.html  pawlice.html  movierec.html  chada.html  snaphere.html
├── styles.css          # 전체 공용 스타일 (68KB)
├── app.js              # 테마, 폴더, 타임라인, 북마크 탭, 필터, role 전환 (28KB)
├── print.html          # PDF 생성용 A4 레이아웃 (배포 제외)
├── portfolio.pdf       # 위에서 뽑은 결과물 (10쪽)
├── assets/             # 스크린샷 + 발표자료에서 추출한 도식 (WebP 29장, 약 1.1MB)
└── vercel.json         # cleanUrls + 보안 헤더
```

프레임워크도 번들러도 없습니다. 파일을 열면 그대로 동작합니다.

### 도식

두 종류가 섞여 있습니다.

- **인라인 SVG** — 데이터 흐름 · 시퀀스 · 구성도. 결론을 `.dgm-lead`로 그림 **위에** 두고,
  제약 같은 메타 정보는 `.dgm-meta`로 캡션에 내립니다. 주 경로는 `.fl`(실선), 부수 경로는 `.fl-2`(점선)로 나눕니다.
  화살촉은 채운 삼각형이 아니라 **열린 쉐브론**입니다 — 채운 삼각형은 방향이 아니라 굵어진 선 끝으로 읽힙니다.
- **발표자료에서 추출한 래스터** — `.dgm.pic`. 원본 PDF에서 300dpi로 잘라낸 것이라
  테마와 무관하게 밝은 배경을 씁니다. 세로형은 `.dgm.pic.tall`로 폭을 제한합니다.

| 파일 | 출처 |
|---|---|
| `aws-infra-arch.webp` | CDA 최종 발표자료 p15 · 서비스 수준 인프라 구성도 |
| `aws-arch-single/multi.webp` | 인프라 아키텍처 4선 p10 · p11 |
| `dero-pipeline.webp` | 인프라 아키텍처 4선 p14 · 무중단 배포 파이프라인 |
| `lumiere-arch.webp` | 루미에르 발표용 p25 · 배포 구성 |

---

## 배포

```bash
npx vercel deploy --prod --yes
```

주소는 프로젝트 도메인 `sungeun-portfolio.vercel.app`에 고정되어 있습니다 — 다시 배포해도 링크는 바뀌지 않습니다.

PDF를 다시 뽑으려면 `print.html`을 Chrome 헤드리스로 인쇄합니다.

```bash
chrome --headless=new --no-pdf-header-footer --print-to-pdf=portfolio.pdf print.html
```

`print.html`은 사이트와 별개 파일이라 **자동으로 따라오지 않습니다.** 내용을 고쳤다면 여기도 같이 고쳐야 합니다.

---

## 손볼 만한 자리

| 무엇 | 어디 |
|---|---|
| 직무별 대표 3선과 문구 | `app.js` 의 `ROLES` |
| 폴더 색 중복 해소 규칙 | `app.js` 의 `PAL` — 색을 혼자 주장하는 프로젝트가 먼저 가져갑니다 |
| 타임라인 기울기 · 행 높이 | `styles.css` 의 `.tlx { --sk, --row1, --row3 }` |
| 접히는 의사결정 카드 | `styles.css` 의 `.dec-more` |
| 연락처 | 푸터 `id="contact"` — `pppp000310@gmail.com`. 전화번호는 공개 노출을 피해 넣지 않았습니다 |

---

## 설계 메모

- **화이트가 기본**입니다. 다크는 `[data-theme="dark"]`로 선택하며 `localStorage`에 남습니다.
- **`prefers-reduced-motion`에서도 기울기는 유지**합니다. 정지된 레이아웃은 모션이 아니기 때문입니다.
  이 설정에서는 전환 시간을 `0.16s`로 짧게 두고, 회전처럼 이동량이 큰 것만 줄입니다.
  전환을 `0`으로 만들면 부드러워지는 게 아니라 끊깁니다.
- 루트 글자 크기는 **17px**이며, 대부분의 치수가 `rem`이라 여기 하나로 전체가 따라옵니다.
- 페이지마다 `<h1>`이 정확히 하나씩 있습니다.

---

## 참고

DERO의 소스는 SSAFY GitLab에 있어 외부 열람이 되지 않습니다(전체가 로그인 뒤에 있습니다).
사이트에도 `소스 · SSAFY GitLab (로그인 필요)`로 표기해 두었습니다.
