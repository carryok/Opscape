from pathlib import Path

from app.analyzer.parser import analyze_file
from app.analyzer.dependencies import resolve_import
from app.analyzer.git_metrics import get_file_git_metrics

IGNORED_DIRECTORIES = {
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "node_modules",
    "dist",
    "build",
}


def analyze_repository(root_path: str) -> dict:
    root = Path(root_path)
    files = []
    directories = set()

    for path in root.rglob("*.py"):
        if any(part in IGNORED_DIRECTORIES for part in path.parts):
            continue

        relative_path = path.relative_to(root)

        # Record every directory containing Python files.
        parent = relative_path.parent
        while parent != Path("."):
            directories.add(str(parent))
            parent = parent.parent

        result = analyze_file(str(path))
        result["path"] = str(relative_path)

        dependencies = []

        for import_name in result["imports"]:
            resolved = resolve_import(import_name, root)

            if resolved:
                dependencies.append(resolved)

        result["dependencies"] = dependencies

        git_metrics = get_file_git_metrics(
            root.parent,
            str(root.name / relative_path)
        )

        result["git_metrics"] = git_metrics

        files.append(result)

    total_lines = sum(
        file["lines"]
        for file in files
    )

    average_complexity = (
        sum(file["complexity"] for file in files)
        / len(files)
        if files
        else 0
    )

    total_git_changes = sum(
        file["git_metrics"]["changes"]
        for file in files
    )

    total_commits = sum(
        file["git_metrics"]["commits"]
        for file in files
    )

    max_complexity = max(
        (file["complexity"] for file in files),
        default=1,
    )

    max_changes = max(
        (
            file["git_metrics"]["changes"]
            for file in files
        ),
        default=1,
    )

    for file in files:
        complexity_score = (
            file["complexity"] / max_complexity
            if max_complexity
            else 0
        )

        churn_score = (
            file["git_metrics"]["changes"] / max_changes
            if max_changes
            else 0
        )

        file["hotspot_score"] = round(
            (complexity_score + churn_score) / 2,
            2,
        )
        directory_metrics = {}

    for file in files:
        file_path = Path(file["path"])
        parent = file_path.parent

        while parent != Path("."):
            directory = str(parent)

            if directory not in directory_metrics:
                directory_metrics[directory] = {
                    "files": 0,
                    "lines": 0,
                    "complexity": 0,
                    "git_changes": 0,
                    "hotspot_score": 0,
                }

            metrics = directory_metrics[directory]

            metrics["files"] += 1
            metrics["lines"] += file["lines"]
            metrics["complexity"] += file["complexity"]
            metrics["git_changes"] += file["git_metrics"]["changes"]
            metrics["hotspot_score"] += file["hotspot_score"]

            parent = parent.parent

    for metrics in directory_metrics.values():
        file_count = metrics["files"]

        metrics["complexity"] = round(
            metrics["complexity"] / file_count,
            2,
        )

        metrics["hotspot_score"] = round(
            metrics["hotspot_score"] / file_count,
            2,
        )

    return {
        "root": str(root),
        "total_files": len(files),
        "total_lines": total_lines,
        "average_complexity": round(average_complexity, 2),
        "total_git_changes": total_git_changes,
        "total_commits": total_commits,
        "directories": sorted(directories),
        "directory_metrics": directory_metrics,
        "files": files,
    }