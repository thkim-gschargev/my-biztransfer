# Git & Vercel 배포 가이드

> 코드를 수정하고 → GitHub에 올리고 → Vercel이 자동 배포하는 흐름을 정리합니다.

---

## 전체 흐름 한눈에 보기

```
내 PC (코드 수정)
    ↓  git add .
    ↓  git commit -m "메시지"
    ↓  git push
GitHub (저장소 업데이트)
    ↓  자동 감지
Vercel (자동 재배포)
    ↓  완료
배포 URL 반영
```

---

## 최초 1회 설정 (이미 했다면 건너뜀)

### 1. GitHub 저장소 연결

```bash
# my-work 폴더에서 실행
cd /Users/taetae/VibeCoding/my-work

# GitHub 저장소 주소 연결
git remote add origin https://github.com/<username>/<repo-name>.git

# 브랜치 이름을 main으로 지정
git branch -M main

# 최초 push (-u 옵션은 최초 1회만 필요)
git push -u origin main
```

### 2. Vercel 연결

1. [vercel.com](https://vercel.com) → GitHub 계정으로 로그인
2. **Add New → Project** → 저장소 선택 → **Deploy**
3. 완료 후 배포 URL 확인 (예: `https://work-control-board.vercel.app`)

---

## 일상적인 수정 → 배포 흐름

코드를 고칠 때마다 아래 3개 명령어를 순서대로 실행합니다.

```bash
# 1. 변경된 파일 전체를 스테이지에 올림
git add .

# 2. 이력으로 저장 (메시지는 무슨 작업인지 간략히)
git commit -m "작업 내용 설명"

# 3. GitHub에 업로드 → Vercel 자동 재배포 시작
git push
```

push 직후 Vercel 대시보드에서 배포 진행 상태를 확인할 수 있습니다.
보통 1~2분 안에 배포 URL에 반영됩니다.

---

## 커밋 메시지 작성 요령

메시지는 나중에 어떤 변경인지 알 수 있게 간략히 씁니다.

| 유형 | 예시 |
|------|------|
| 새 기능 | `feat: 업무 복제 기능 추가` |
| 버그 수정 | `fix: 날짜 필터 오류 수정` |
| 디자인 수정 | `style: 사이드바 색상 변경` |
| 내용 수정 | `update: 카테고리 항목 추가` |
| 삭제 | `remove: 미사용 컴포넌트 제거` |

영어/한국어 모두 괜찮습니다. 혼자 쓰는 저장소라면 형식에 너무 얽매이지 않아도 됩니다.

---

## 현재 상태 확인 명령어

```bash
# 어떤 파일이 변경됐는지 확인
git status

# 변경 내용 상세 확인 (줄 단위)
git diff

# 커밋 이력 확인
git log --oneline
```

---

## 자주 쓰는 상황별 명령어

### 특정 파일만 커밋하고 싶을 때

```bash
# 파일 하나만 스테이지에 올림
git add src/app/page.tsx

# 나머지는 포함하지 않고 커밋
git commit -m "fix: 대시보드 레이아웃 수정"
```

### 마지막 커밋 메시지를 바꾸고 싶을 때

> push 하기 전에만 가능

```bash
git commit --amend -m "새 메시지"
```

### 스테이지에 올린 것을 취소하고 싶을 때

```bash
# 특정 파일만
git restore --staged src/app/page.tsx

# 전체 취소
git restore --staged .
```

### 파일 수정을 되돌리고 싶을 때

> 주의: 복구 불가. 신중하게 사용

```bash
git restore src/app/page.tsx
```

---

## Vercel 배포 확인

push 후 배포 상태 확인 방법:

1. [vercel.com](https://vercel.com) 대시보드 → 프로젝트 클릭
2. **Deployments** 탭에서 진행 상태 확인
3. 초록색 **Ready** 표시 → 배포 완료

빌드 오류가 발생하면 해당 배포 항목을 클릭해서 로그를 확인할 수 있습니다.

---

## 문제 상황 대처

### push가 거부될 때

```
! [rejected] main -> main (fetch first)
```

다른 곳에서 push된 내용이 있을 때 발생. 아래 순서로 해결:

```bash
git pull --rebase
git push
```

### GitHub 인증 오류가 날 때

Personal Access Token을 비밀번호 자리에 입력해야 합니다.

- GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
- **Generate new token** → `repo` 권한 체크 → 생성
- 이후 git push 시 비밀번호 자리에 토큰 붙여넣기

Mac은 키체인에 저장되어 다음부터 자동 입력됩니다.

---

## 요약 치트시트

```bash
git status                        # 현재 상태 확인
git add .                         # 전체 변경사항 스테이지에 올림
git commit -m "작업 내용"         # 이력 저장
git push                          # GitHub 업로드 → Vercel 자동 배포
git log --oneline                 # 커밋 이력 보기
git pull --rebase                 # GitHub 최신 내용 가져오기
```
