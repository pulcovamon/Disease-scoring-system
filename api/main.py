import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scoring_system import endpoints

app = FastAPI(name="scoring-system")
app.include_router(endpoints.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9684)
