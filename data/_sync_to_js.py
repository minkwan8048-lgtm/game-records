# -*- coding: utf-8 -*-
"""
games.json → games.js 자동 변환.

용도:
- 진실 원본은 data/games.json. data/games.js는 이 스크립트로 자동 생성.
- file:// 프로토콜에서 fetch가 막히는 문제를 우회하기 위해 JS에 임베드.
- index.html이 <script src="data/games.js">로 로드 → window.GAMES_DATA에 노출.

사용법:
    python data/_sync_to_js.py

데이터 수정 워크플로:
1. data/games.json 수정
2. python data/_sync_to_js.py 실행
3. 브라우저에서 index.html 새로고침
"""

import json
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "games.json"
DST = HERE / "games.js"


def main():
    with SRC.open(encoding="utf-8") as f:
        data = json.load(f)

    # games 배열을 hours 내림차순으로 정렬 (stable sort: 동률은 JSON 입력 순서 유지)
    if "games" in data:
        data["games"] = sorted(data["games"], key=lambda g: -g.get("hours", 0))

    header = (
        "/* =========================================================\n"
        "   Game Records - 데이터 임베드 (자동 생성)\n"
        "   data/games.json에서 _sync_to_js.py로 변환됨.\n"
        "   games 배열은 hours 내림차순으로 자동 정렬됨.\n"
        "   직접 수정하지 말 것 - games.json을 수정 후 스크립트 재실행.\n"
        "   ========================================================= */\n"
        "window.GAMES_DATA = "
    )

    body = json.dumps(data, ensure_ascii=False, indent=2)

    with DST.open("w", encoding="utf-8") as f:
        f.write(header)
        f.write(body)
        f.write(";\n")

    games_count = len(data.get("games", []))
    genres_count = len(data.get("genres", []))
    print(f"OK: {SRC.name} -> {DST.name}  ({games_count} games, {genres_count} genres, sorted by hours desc)")


if __name__ == "__main__":
    main()
