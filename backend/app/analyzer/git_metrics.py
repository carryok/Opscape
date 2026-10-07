import subprocess
from pathlib import Path


def get_file_git_metrics(root_path: str, file_path: str) -> dict:
    root = Path(root_path).resolve()

    result = subprocess.run(
        [
            "git",
            "log",
            "--follow",
            "--numstat",
            "--pretty=format:%H",
            "--",
            file_path,
        ],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    )

    commits = 0
    insertions = 0
    deletions = 0

    for line in result.stdout.splitlines():
        if len(line) == 40 and all(
            character in "0123456789abcdef"
            for character in line
        ):
            commits += 1

        elif line and line[0].isdigit():
            parts = line.split("\t")

            if len(parts) == 3:
                added, deleted, _ = parts

                if added.isdigit():
                    insertions += int(added)

                if deleted.isdigit():
                    deletions += int(deleted)

    return {
        "commits": commits,
        "insertions": insertions,
        "deletions": deletions,
        "changes": insertions + deletions,
    }