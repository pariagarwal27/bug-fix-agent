import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

from agent import run_bug_fix_agent

app = FastAPI(title="Bug Fix Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_client = AsyncIOMotorClient(os.getenv("MONGODB_URL", "mongodb://localhost:27017"))
db = mongo_client["bug_fix_agent"]
sessions_collection = db["sessions"]


class FixRequest(BaseModel):
    repo_url: str
    bug_description: str


@app.get("/")
async def root():
    return {"message": "Bug Fix Agent API is running 🚀"}


@app.get("/sessions")
async def get_sessions():
    """Get all past fix sessions"""
    sessions = await sessions_collection.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return sessions


@app.websocket("/ws/fix")
async def websocket_fix(websocket: WebSocket):
    """
    WebSocket endpoint — client sends fix request,
    server streams logs back in real time, then sends final result
    """
    await websocket.accept()

    try:
        # Receive the fix request from frontend
        data = await websocket.receive_text()
        request = json.loads(data)

        repo_url = request.get("repo_url", "").strip()
        bug_description = request.get("bug_description", "").strip()

        if not repo_url or not bug_description:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "repo_url and bug_description are required"
            }))
            return

        # Send initial acknowledgment
        await websocket.send_text(json.dumps({
            "type": "log",
            "message": f"🚀 Starting Bug Fix Agent for: {repo_url}"
        }))

        # Log callback — sends each log line to frontend via WebSocket
        async def log_callback(message: str):
            await websocket.send_text(json.dumps({
                "type": "log",
                "message": message
            }))
            await asyncio.sleep(0.05)  # small delay for streaming effect

        # Run the agent
        result = await run_bug_fix_agent(repo_url, bug_description, log_callback)

        # Save session to MongoDB
        session = {
            "repo_url": repo_url,
            "bug_description": bug_description,
            "result": result,
            "created_at": datetime.utcnow().isoformat(),
            "success": result.get("success", False)
        }
        await sessions_collection.insert_one(session)

        # Send final result
        await websocket.send_text(json.dumps({
            "type": "result",
            "data": result
        }))

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Server error: {str(e)}"
        }))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)