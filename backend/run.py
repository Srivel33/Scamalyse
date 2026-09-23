import os
import uvicorn

if __name__ == "__main__":
    is_prod = "PORT" in os.environ or os.getenv("ENVIRONMENT") == "production"
    host = os.getenv("HOST", "0.0.0.0" if is_prod else "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = not is_prod

    print(f"Starting Scamalyse API on http://{host}:{port} (reload={reload}) ...")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)

