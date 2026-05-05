# GitHub Pages 배포 가이드

## 사전 준비
- GitHub 계정 (없으면 https://github.com 가입)
- Git 설치 (https://git-scm.com/)

## 1. GitHub 저장소 생성

1. https://github.com/new 접속
2. **Repository name:** `game-records` (또는 원하는 이름)
3. **Public** 선택 (Pages는 무료에서 Public만 지원)
4. README 추가 체크 해제
5. "Create repository" 클릭

## 2. 로컬 파일 푸시

```powershell
cd C:\Users\zoowi\Documents\job-prep\outputs\game-records

git init
git add .
git commit -m "Initial commit - 게임 기록지 사이트 (57 games)"
git branch -M main
git remote add origin https://github.com/{본인GitHubID}/game-records.git
git push -u origin main
```

`{본인GitHubID}` 자리에 실제 GitHub 사용자명 입력.

## 3. GitHub Pages 활성화

1. 저장소 페이지 → **Settings** 탭
2. 좌측 메뉴 **Pages** 클릭
3. **Source**: `Deploy from a branch` 선택
4. **Branch**: `main` / `/ (root)` 선택
5. Save 클릭
6. 1~2분 대기 후 페이지 상단에 URL 표시:
   `https://{본인GitHubID}.github.io/game-records/`

## 4. 사이트 확인

위 URL을 브라우저에서 열어 정상 작동 확인.
- 홈 → 주요 기록 → 게임 상세 등 모든 라우팅 테스트

## 5. 짧은 URL (선택)

저장소 이름을 `{본인GitHubID}.github.io`로 만들면:
- URL: `https://{본인GitHubID}.github.io/` (깔끔)
- 단점: 한 GitHub 계정에 1개만 가능

## 6. 데이터 갱신

`data/games.json` 수정 후 sync 스크립트 실행하고 push:

```powershell
cd C:\Users\zoowi\Documents\job-prep\outputs\game-records

# 1. games.json 수정 후
python data/_sync_to_js.py     # games.js 자동 갱신 (정렬 포함)

# 2. 푸시
git add .
git commit -m "Update games"
git push
```

푸시 후 1분 내 사이트 갱신.

## 트러블슈팅

- **404**: 저장소 이름과 URL 경로 확인. 첫 배포는 1-5분 걸림.
- **데이터 로딩 실패**: 브라우저 개발자 도구(F12) 콘솔 확인. 보통 `data/games.json` 경로 문제.
- **CSS 깨짐**: 캐시. `Ctrl+Shift+R`로 강력 새로고침.

## 이력서·자소서에 첨부

- 자소서 본문: "게임 플레이 이력은 [URL]에서 확인할 수 있습니다."
- 포트폴리오 PPT 표지 우상단 QR 코드 추천 (qr-code-generator.com 등에서 무료 생성)
