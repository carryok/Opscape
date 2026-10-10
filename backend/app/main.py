from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.analyzer.execution_tracer import trace_python_source
from pydantic import BaseModel
from pathlib import Path
from fastapi import HTTPException

from app.db import engine
from app.analyzer.repository import analyze_repository
from app.schemas.analysis import RepositoryInfo


app = FastAPI(title="Opscape API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-health")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"database": "connected"}


@app.get("/analyze", response_model=RepositoryInfo)
def analyze(path: str):
    return analyze_repository(path)

class TraceRequest(BaseModel):
    source: str


@app.post("/trace")
def trace_code(request: TraceRequest):
    return trace_python_source(request.source)

@app.get("/source")
def get_source(path: str):
    # Opscape currently analyzes the backend/app directory.
    repository_root = Path(__file__).resolve().parent

    requested_path = (repository_root / path).resolve()

    # Prevent reading files outside the analyzed repository.
    if not requested_path.is_relative_to(repository_root):
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not requested_path.is_file() or requested_path.suffix != ".py":
        raise HTTPException(status_code=404, detail="Python file not found")

    try:
        source = requested_path.read_text(encoding="utf-8")
    except OSError:
        raise HTTPException(status_code=500, detail="Could not read source file")

    return {"path": path, "source": source}