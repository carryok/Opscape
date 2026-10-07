import ast


def calculate_complexity(node: ast.AST) -> int:
    complexity = 1

    for child in ast.walk(node):
        if isinstance(
            child,
            (
                ast.If,
                ast.For,
                ast.While,
                ast.ExceptHandler,
                ast.With,
                ast.Assert,
            ),
        ):
            complexity += 1

        elif isinstance(child, ast.BoolOp):
            complexity += len(child.values) - 1

    return complexity


def analyze_file(file_path: str) -> dict:
    with open(file_path, "r", encoding="utf-8") as file:
        source = file.read()

    try:
        tree = ast.parse(source)
    except SyntaxError as error:
        return {
            "file": file_path,
            "lines": len(source.splitlines()),
            "functions": [],
            "classes": [],
            "imports": [],
            "error": f"Syntax error on line {error.lineno}",
        }

    functions = []
    classes = []
    imports = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            functions.append(
                {
                    "name": node.name,
                    "start_line": node.lineno,
                    "end_line": node.end_lineno,
                    "complexity": calculate_complexity(node),
                }
            )

        elif isinstance(node, ast.ClassDef):
            classes.append(
                {
                    "name": node.name,
                    "line": node.lineno,
                }
            )

        elif isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)

        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)

    # Calculate file-level complexity AFTER
    # processing the entire AST.
    file_complexity = (
        sum(function["complexity"] for function in functions)
        / len(functions)
        if functions
        else 1
    )

    return {
        "file": file_path,
        "lines": len(source.splitlines()),
        "functions": functions,
        "classes": classes,
        "imports": imports,
        "complexity": round(file_complexity, 2),
    }