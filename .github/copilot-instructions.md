# Copilot Instructions

## Safety Guidelines

### Git Operations

- **NEVER** perform destructive git commands including but not limited to:
  - `git push --force` or `git push -f`
  - `git push --force-with-lease`
  - `git reset --hard` (especially with commit hashes)
  - `git branch -D` (force delete branches)
  - `git tag -d` (delete tags)
  - `git push --delete` (delete remote branches/tags)
  - `git push origin :branch-name` (delete remote branches)
  - `git rebase -i` with squash/drop operations on shared commits
  - `git filter-branch`
  - `git reflog expire`
  - `git gc --aggressive --prune=now`

### Safe Git Operations

- Use `git status` to check repository state
- Use `git log` to view commit history
- Use `git diff` to see changes
- Use `git add` and `git commit` for staging and committing
- Use `git pull` for fetching updates
- Use `git checkout -b` for creating new branches
- Use `git merge` for safe merging (avoid force merges)

### General Safety Rules

- Always confirm before making changes that affect remote repositories
- Prefer non-destructive operations
- When in doubt, suggest the user perform the operation manually
- Ask for explicit confirmation before any operation that could lose data or history

### Best Practices

- Use descriptive commit messages
- Create feature branches for new work
- Keep commits atomic and focused
- Review changes before committing
