
import ast
from dataclasses import dataclass, asdict


@dataclass
class TraceStep:
    step: int
    line: int
    event: str
    function: str
    detail: str


class ExecutionTracer(ast.NodeVisitor):
    """Build a static, ordered outline of Python statements and calls."""

    def __init__(self):
        self.steps = []
        self.current_function = "<module>"

    def add_step(self, node, event, detail):
        self.steps.append(
            TraceStep(
                step=len(self.steps) + 1,
                line=getattr(node, "lineno", 1),
                event=event,
                function=self.current_function,
                detail=detail,
            )
        )

    def visit_FunctionDef(self, node):
        self.add_step(node, "function_definition", f"Define {node.name}")

        previous_function = self.current_function
        self.current_function = node.name

        for statement in node.body:
            self.visit(statement)

        self.current_function = previous_function

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            name = node.func.attr
        else:
            name = "<call>"

        self.add_step(node, "function_call", f"Call {name}")
        self.generic_visit(node)

    def visit_Return(self, node):
        self.add_step(node, "return", "Return value")
        self.generic_visit(node)

    def visit_If(self, node):
        self.add_step(node, "condition", "Evaluate if condition")
        self.generic_visit(node)

    def visit_For(self, node):
        self.add_step(node, "loop", "For loop")
        self.generic_visit(node)

    def visit_While(self, node):
        self.add_step(node, "loop", "While loop")
        self.generic_visit(node)


def trace_python_source(source: str) -> dict:
    """Return a static outline; this does not execute the source code."""
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        return {
            "status": "error",
            "message": f"Syntax error on line {exc.lineno}: {exc.msg}",
            "steps": [],
        }

    tracer = ExecutionTracer()
    tracer.visit(tree)

    return {
        "status": "ok",
        "mode": "static_outline",
        "steps": [asdict(step) for step in tracer.steps],
    }
