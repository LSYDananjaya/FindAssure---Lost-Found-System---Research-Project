import os
import sys
import warnings
import uvicorn

# 1. Suppress pkg_resources UserWarnings
warnings.filterwarnings("ignore", category=UserWarning, module="pkg_resources")

# 2. Ensure the script adds the current directory to sys.path
sys.path.append(os.getcwd())

if __name__ == "__main__":
    print("Starting Vision Core Server...")

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
