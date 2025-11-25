# Auto Deploy (Changesets 기반)

GitHub Actions를 통해 main 또는 develop 브랜치에 푸시하면 **Changesets**로 버전을 올리고 npm에 배포합니다. 커밋 메시지 접두사는 더 이상 버전을 결정하지 않습니다.

## 기본 흐름
1. 기능/버그 작업 후 `pnpm changeset` 실행 → major/minor/patch 선택 → 요약 작성. 생성된 파일은 `.changeset/*.md`에 생깁니다.
2. 코드와 함께 Changeset 파일을 커밋/PR에 포함합니다.
3. PR을 main 또는 develop으로 머지하면 워크플로우가 실행됩니다.
4. 워크플로우는 테스트/빌드 통과 후 pending changeset이 있을 때만:
   - `pnpm changeset version`으로 `package.json`, `pnpm-lock.yaml`, `CHANGELOG.md`를 업데이트하고 커밋/태그(`vX.Y.Z`)를 푸시
   - `pnpm changeset publish --no-git-checks`로 npm 배포
   - 생성된 changelog로 GitHub Release 생성
5. pending changeset이 없으면 배포를 건너뜁니다.

## 1. npm 토큰 발급

1. [npmjs.com](https://www.npmjs.com)에 로그인
2. 프로필 → **Access Tokens** 클릭
3. **Generate New Token** → **Classic Token** 선택
4. Type: **Automation** 선택 (CI/CD 용도)
5. 생성된 토큰 복사

## 2. GitHub Secrets 설정

1. GitHub 저장소 페이지 이동
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. Name: `NPM_TOKEN`
5. Secret: 복사한 npm 토큰 붙여넣기
6. **Add secret** 클릭

## 3. 배포 방법

### 자동 배포 (권장)

main 또는 develop 브랜치에 푸시하면 자동으로:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main  # 또는 develop
```

**자동 실행 프로세스:**
1. ✅ 커밋 메시지 분석
2. ✅ Type check
3. ✅ Build
4. ✅ 버전 자동 증가 (커밋 메시지에 따라 major/minor/patch)
5. ✅ Git tag 생성 및 푸시
6. ✅ npm 배포
7. ✅ GitHub Release 생성

### 수동 버전 관리 (선택)

특정 버전 타입으로 업그레이드하고 싶을 때:

```bash
# Patch 버전 증가 (1.1.0 → 1.1.1)
pnpm run version:patch

# Minor 버전 증가 (1.1.0 → 1.2.0)
pnpm run version:minor

# Major 버전 증가 (1.1.0 → 2.0.0)
pnpm run version:major
```

## 4. 배포 확인

### GitHub Actions 확인
1. GitHub 저장소 → **Actions** 탭
2. 최신 워크플로우 실행 상태 확인

### npm 배포 확인
```bash
npm view hsc-fetch
```

### 버전 확인
```bash
npm view hsc-fetch version
```

## 5. 워크플로우 설정

`.github/workflows/publish.yml` 파일에서 설정 확인 가능:

- **트리거 브랜치**: main, develop
- **자동 버전업**: patch (1.1.0 → 1.1.1)
- **Node 버전**: 20
- **패키지 매니저**: pnpm 10

## 6. 문제 해결

### npm 배포 실패 시
- `NPM_TOKEN`이 올바르게 설정되었는지 확인
- npm 토큰이 **Automation** 타입인지 확인
- npm 패키지명이 이미 존재하는지 확인

### Git 푸시 실패 시
- GitHub Actions가 repo에 write 권한이 있는지 확인
- Settings → Actions → General → Workflow permissions → Read and write permissions 체크

### 버전 충돌 시
- npm에 이미 같은 버전이 배포되어 있지 않은지 확인
- `package.json`의 버전을 수동으로 조정

## 7. 배포 스킵

커밋 메시지에 `[skip ci]`를 포함하면 배포를 건너뜁니다:

```bash
git commit -m "docs: update README [skip ci]"
```

## 8. 로컬 테스트

배포 전 로컬에서 빌드 테스트:

```bash
pnpm install
pnpm run type-check
pnpm run build

# 버전/배포 수동 실행 (필요 시)
# pending changeset이 있을 때만 의미가 있습니다.
# 로컬에서 버전+배포: pnpm run release
```
