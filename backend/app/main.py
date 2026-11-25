"""
Smart Inventory and Warehouse Management System - Backend Application Entry Point.
Framework: FastAPI (Python 3.12)
"""

import os
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.api import inventory, academic, hardware
from app.db.connection import get_db

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "College Engineering Project Backend: Integrates ESP32, RFID RC522, "
        "and 10kg Load Cell (HX711) with MySQL DBMS and Python Data Structures."
    ),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable Cross-Origin Resource Sharing (CORS) for frontend UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(inventory.router)
app.include_router(academic.router)
app.include_router(hardware.router)

# Locate Frontend Directory
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
css_dir = os.path.join(frontend_dir, "css")
js_dir = os.path.join(frontend_dir, "js")

# Mount Static Assets (/css, /js, and /static)
if os.path.exists(css_dir):
    app.mount("/css", StaticFiles(directory=css_dir), name="css")

if os.path.exists(js_dir):
    app.mount("/js", StaticFiles(directory=js_dir), name="js")

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/", tags=["Frontend Web App"])
    @app.get("/dashboard", tags=["Frontend Web App"])
    @app.get("/index.html", tags=["Frontend Web App"])
    def get_dashboard_page():
        """Serves the main operations dashboard HTML."""
        return FileResponse(os.path.join(frontend_dir, "index.html"))

    @app.get("/products", tags=["Frontend Web App"])
    @app.get("/products.html", tags=["Frontend Web App"])
    def get_products_page():
        """Serves the unified application with Product Management module activated."""
        return FileResponse(os.path.join(frontend_dir, "index.html"))

    @app.get("/academic", tags=["Frontend Web App"])
    @app.get("/academic.html", tags=["Frontend Web App"])
    @app.get("/academic-view", tags=["Frontend Web App"])
    def get_academic_page():
        """Serves the unified application with Academic & Viva module activated."""
        return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/api/health", tags=["System Diagnostics"])
def health_check():
    """
    Checks system health, verifies active MySQL connection,
    and returns current load metrics.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT VERSION() AS mysql_version;")
                db_ver = cursor.fetchone()
                
                cursor.execute("SELECT COUNT(*) AS total_products FROM products;")
                prod_count = cursor.fetchone()
                
                cursor.execute("SELECT max_capacity_kg, current_load_kg, status FROM warehouse_metrics WHERE id = 1;")
                metrics = cursor.fetchone()
                
        return {
            "status": "healthy",
            "database": {
                "connected": True,
                "engine": "MySQL / MariaDB",
                "version": db_ver["mysql_version"] if db_ver else "Unknown",
                "total_products": prod_count["total_products"] if prod_count else 0
            },
            "warehouse_scale": {
                "max_capacity_kg": float(metrics["max_capacity_kg"]) if metrics else settings.MAX_CAPACITY_KG,
                "current_load_kg": float(metrics["current_load_kg"]) if metrics else 0.0,
                "status": metrics["status"] if metrics else "NORMAL"
            }
        }
    except Exception as exc:
        return {
            "status": "degraded",
            "database": {
                "connected": False,
                "error": str(exc)
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
