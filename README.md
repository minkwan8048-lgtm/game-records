# 게임 기록지 사이트

서민관 게임 플레이 이력·성취 정적 사이트.
이력서·자소서·포트폴리오에 첨부할 보조 자료.

## 구조

```
outputs/game-records/
├── index.html          # 단일 진입점 (SPA)
├── style.css           # 다크 네이비 + 사이언 디자인
├── script.js           # 해시 라우팅 + 동적 렌더링
├── .nojekyll           # GitHub Pages 빌드 비활성화 (Jekyll 무시)
├── .gitignore          # OS/에디터 메타파일 제외
├── data/
│   ├── games.json      # 게임 데이터 (진실 원본, 사용자가 직접 수정)
│   ├── games.js        # window.GAMES_DATA 임베드 (자동 생성, file:// 호환)
│   └── _sync_to_js.py  # games.json → games.js 변환 스크립트
├── assets/
│   └── games/          # 게임별 스크린샷·로고
├── README.md           # 이 파일
└── _deploy_guide.md    # GitHub Pages 호스팅 가이드
```

## 라우팅

| URL 해시 | 페이지 |
|---|---|
| `#/` | 홈 (표지 + 2개 버튼) |
| `#/major` | 주요 기록 (상위 티어 게임) |
| `#/genres` | 장르 허브 (11개 장르 카드) |
| `#/genres/{id}` | 장르별 상세 (게임 카드 그리드) |
| `#/games/{id}` | 게임 상세 (시간·티어·코멘트) |

## 로컬 확인

브라우저에서 `index.html` 더블클릭으로 열면 됩니다.
`data/games.js` (window.GAMES_DATA)가 임베드되어 있어 `file://` 프로토콜에서도 정상 작동합니다.

## 데이터 수정 워크플로

1. **`data/games.json` 수정** (진실 원본)
2. **`python data/_sync_to_js.py` 실행** → `data/games.js` 자동 갱신 (시간 desc 정렬 포함)
3. **브라우저 새로고침** → 변경사항 반영
4. (호스팅 시) `git push` → GitHub Pages 자동 갱신

`games.js`는 자동 생성 파일이므로 직접 수정하지 마세요.

### 게임 추가 예시

```json
{
  "id": "elden-ring",
  "name": "엘든 링",
  "nameEn": "Elden Ring",
  "genre": "action-adventure",
  "hours": 200,
  "hoursDisplay": "200+ 시간",
  "tier": "",
  "tierBadge": "",
  "season": "",
  "position": "",
  "thumbnail": "",
  "screenshots": [],
  "comment": "(코멘트)"
}
```

`genre` 값은 `data/games.json`의 `genres` 배열의 `id` 중 하나:
- `moba`, `fps`, `rpg`, `action-adventure`, `roguelite`,
  `strategy`, `simulation`, `survival`, `subculture`,
  `sports-fighting`, `etc`

### 주요 기록 추가
`majorRecords` 배열에 게임 `id` 추가.

## 디자인 사양

- 다크 네이비 #1A1A2E (포트폴리오 PPT 일관)
- 사이언 액센트 #00C8E1
- 옐로우 강조 #FFD700 (티어)
- 폰트: Pretendard (한글) / Inter (영문)
- 모바일 반응형
