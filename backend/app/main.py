from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.api import router
from app.database import init_db

app = FastAPI(
    title="TimeMate API",
    description="AI-powered time management tool for indie developers",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health():
    return {"status": "ok", "app": "TimeMate"}