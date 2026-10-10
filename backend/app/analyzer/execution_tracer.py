
import ast
from dataclasses import asdict, dataclass


@dataclass
class TraceStep:
    step: int
    line: int
    event: str
    function: str
    detail: str


class ExecutionTracer(ast.NodeVisitor):
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
        self.add_step(
            node,
            "function_definition",
            f"Define function {node.name}",
        )

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
        if node.value is None:
            detail = "Return without a value"
        else:
            expression = ast.unparse(node.value)
            detail = f"Return expression: {expression}"

        self.add_step(node, "return", detail)
        self.generic_visit(node)

    def visit_If(self, node):
        self.add_step(node, "condition", "Check if condition")

        for statement in node.body:
            self.add_step(
                statement,
                "branch",
                "Statement inside the if branch",
            )
            self.visit(statement)

        if node.orelse:
            for statement in node.orelse:
                self.add_step(
                    statement,
                    "branch",
                    "Statement inside the else branch",
                )
                self.visit(statement)

    def visit_For(self, node):
        self.add_step(node, "loop", "Start of for-loop structure")

        for statement in node.body:
            self.add_step(
                statement,
                "loop_body",
                "Statement inside the for-loop body",
            )
            self.visit(statement)

        for statement in node.orelse:
            self.add_step(
                statement,
                "loop_else",
                "Statement inside the for-loop else block",
            )
            self.visit(statement)


    def visit_While(self, node):
        self.add_step(node, "loop", "Start of while-loop structure")

        for statement in node.body:
            self.add_step(
                statement,
                "loop_body",
                "Statement inside the while-loop body",
            )
            self.visit(statement)

        for statement in node.orelse:
            self.add_step(
                statement,
                "loop_else",
                "Statement inside the while-loop else block",
            )
            self.visit(statement)


def trace_python_source(source: str) -> dict:
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        return {
            "status": "error",
            "message": (
                f"Syntax error on line {exc.lineno}: {exc.msg}"
            ),
            "steps": [],
        }

    tracer = ExecutionTracer()
    tracer.visit(tree)

    return {
        "status": "ok",
        "mode": "static_outline",
        "steps": [asdict(step) for step in tracer.steps],
    }
