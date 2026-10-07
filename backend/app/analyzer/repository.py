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

    return {
        "root": str(root),
        "total_files": len(files),
        "directories": sorted(directories),
        "files": files,
    }