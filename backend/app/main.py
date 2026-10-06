from fastapi import FastAPI
from sqlalchemy import text

from app.db import engine

app = FastAPI(title="Opscape API")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-health")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"database": "connected"}