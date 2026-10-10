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
    hotspot_score: float
    health: str
    health_reasons: list[str]
    functions: list[FunctionInfo]
    classes: list[dict]
    dependencies: list[str]
    git_metrics: GitMetrics

class DirectoryMetrics(BaseModel):
    files: int
    lines: int
    complexity: float
    git_changes: int
    hotspot_score: float

class RepositoryInfo(BaseModel):
    root: str
    total_files: int
    total_lines: int
    average_complexity: float
    total_git_changes: int
    total_commits: int
    directories: list[str]
    directory_metrics: dict[str, DirectoryMetrics]
    files: list[FileInfo]