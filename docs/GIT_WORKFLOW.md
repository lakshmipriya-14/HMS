# Aalayam HMS — Git & Team Collaboration Workflow

This guide details the strict branch management strategy designed for 10 developers collaborating simultaneously on the shared GitHub repository.

---

## 1. Branch Strategy

- **`main`**: Production-ready branch. Protected. Direct pushes are blocked.
- **`develop`**: Central integration branch. All feature branches merge here via Pull Requests.
- **`feature/<module-name>`**: Individual member working branches (e.g., `feature/doctor-consultation`, `feature/pharmacy-inventory`, `feature/reception-tokens`).
- **`bugfix/<ticket-id>`**: Isolated defect remediation branches.

---

## 2. Developer Daily Workflow Guide

### Step 1: Clone Repository
```bash
git clone https://github.com/organization/multispeciality-hms.git
cd multispeciality-hms
```

### Step 2: Install Workspace Dependencies & Build Packages
```bash
pnpm install
pnpm build:packages
```

### Step 3: Create Feature Branch From `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/doctor-consultation
```

### Step 4: Daily Sync with Team Changes
Every morning before starting work or before pushing:
```bash
git fetch origin
git merge origin/develop
# Or: git rebase origin/develop
```

### Step 5: Stage and Commit Changes
Follow Conventional Commits:
```bash
git add .
git commit -m "feat(doctor): implement digital prescription generator with frequency & dosages"
```

### Step 6: Push Branch to Remote
```bash
git push -u origin feature/doctor-consultation
```

### Step 7: Open Pull Request
- Target branch: **`develop`**
- Base branch: **`feature/doctor-consultation`**
- At least 1 peer approval + green CI pipeline required before merging.

---

## 3. Resolving Merge Conflicts

If a conflict occurs:
```bash
git fetch origin
git merge origin/develop
# Open conflicted files in VS Code / IDE and resolve conflicts
git add <resolved-files>
git commit -m "chore: resolve merge conflicts with develop"
git push origin feature/doctor-consultation
```
