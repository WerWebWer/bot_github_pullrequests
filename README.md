# Weighted Assign Action

Automatically distribute pull request reviews

## Example workflow

Reviewer configuration is stored in `.github/reviewers.txt` by default. This can be changed with the `config` option.

`.github/workflows/auto-assign-review.yml`:

```yml
name: Auto Assign Review
on:
  pull_request:
    types: [opened, ready_for_review, reopened]
jobs:
  distribute:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Distribute PRs
        uses: TwoStoryRobot/weighted-assign-action@v1.0.0
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          config: some-other-file.txt # Optional
```

`.github/reviewers.txt`:

```
user1 1
user2 1
user-with-half 0.5
user-with-none 0
```
