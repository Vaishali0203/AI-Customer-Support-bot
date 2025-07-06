import os
import shutil
from dotenv import load_dotenv

load_dotenv()

# Configuration
top_dir = os.environ.get("TOP_DIR")
articles_dir = os.environ.get("ARTICLES_DIR")
articles_dir_path = os.path.join(top_dir, articles_dir)
temp_dir_path = os.path.join(articles_dir_path, "temp")

def cleanup_temp_folder():
    """Remove the temp folder and all its contents."""
    if os.path.exists(temp_dir_path):
        try:
            shutil.rmtree(temp_dir_path)
            print(f"🗑️ Cleaned up temp folder: {temp_dir_path}")
        except Exception as e:
            print(f"⚠️ Error removing temp folder: {e}")
    else:
        print(f"ℹ️ Temp folder does not exist: {temp_dir_path}")

def main():
    print("🚀 Starting temp folder cleanup...")
    cleanup_temp_folder()
    print("✅ Temp folder cleanup completed!")

if __name__ == "__main__":
    main()