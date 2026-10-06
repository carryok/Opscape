from pathlib import Path


def resolve_import(import_name: str, root: Path) -> str | None:
    parts = import_name.split(".")

    # If the import starts with the root package name,
    # remove that package name first.
    if parts[0] == root.name:
        parts = parts[1:]

    module_path = root.joinpath(*parts)

    # Example: app.db -> app/db.py
    file_path = module_path.with_suffix(".py")

    if file_path.exists():
        return str(file_path.relative_to(root))

    # Example: app.analyzer -> app/analyzer/__init__.py
    init_path = module_path / "__init__.py"

    if init_path.exists():
        return str(init_path.relative_to(root))

    return None