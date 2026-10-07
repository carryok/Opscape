from pathlib import Path

from app.analyzer.parser import analyze_file
from app.analyzer.dependencies import resolve_import


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
        files.append(result)

    return {
        "root": str(root),
        "total_files": len(files),
        "directories": sorted(directories),
        "files": files,
    }