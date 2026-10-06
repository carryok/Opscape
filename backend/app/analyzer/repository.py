from pathlib import Path
from app.analyzer.dependencies import resolve_import
from app.analyzer.parser import analyze_file


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

    for path in root.rglob("*.py"):
        if any(part in IGNORED_DIRECTORIES for part in path.parts):
            continue

        result = analyze_file(str(path))

        relative_path = path.relative_to(root)
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
        "files": files,
        "total_files": len(files),
    }