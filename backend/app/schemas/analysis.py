from pydantic import BaseModel


class FunctionInfo(BaseModel):
    name: str
    start_line: int
    end_line: int
    complexity: int

class GitMetrics(BaseModel):
    commits: int
    insertions: int
    deletions: int
    changes: int

    
class FileInfo(BaseModel):
    path: str
    lines: int
    complexity: float
    functions: list[FunctionInfo]
    classes: list[dict]
    dependencies: list[str]
    git_metrics: GitMetrics


class RepositoryInfo(BaseModel):
    root: str
    total_files: int
    directories: list[str]
    files: list[FileInfo]