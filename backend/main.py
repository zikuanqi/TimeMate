from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import time_blocks, tasks, focus_sessions

@asynccontextmanager
async def lifespan(app: FastAPI):
    time_blocks.init_db()
    tasks.init_db()
    focus_sessions.init_db()
    yield

app = FastAPI(title="AI TimeMate API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(time_blocks.router)
app.include_router(tasks.router)
app.include_router(focus_sessions.router)


@app.get("/")
def root():
    return {"app": "AI TimeMate", "version": "0.1.0"}


@app.get("/health")
def health():
    return {"status": "ok"}