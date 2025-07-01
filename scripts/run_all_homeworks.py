import subprocess
import sys
import os

def run_backend(path, port):
    env = os.environ.copy()
    env["PORT"] = str(port)
    return subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=path,
        env=env
    )

if __name__ == "__main__":
    processes = []
    try:
        print("Starting Homework 01 backend on port 8000...")
        processes.append(run_backend("features/01-vibe-check/backend", 8000))
        print("Starting Homework 02 backend on port 8001...")
        processes.append(run_backend("features/02-embeddings-rag/backend", 8001))
        print("Both backends are running. Press Ctrl+C to stop.")
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
        for p in processes:
            p.terminate() 