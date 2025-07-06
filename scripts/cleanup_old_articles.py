import requests
import os
import shutil
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Configuration
ARTICLES_API_URL = "http://backend:8000/articles"
top_dir = os.environ.get("TOP_DIR")
articles_dir = os.environ.get("ARTICLES_DIR")
articles_dir_path = os.path.join(top_dir, articles_dir)

def delete_local_articles_folder():
    """Delete the entire local articles folder."""
    if os.path.exists(articles_dir_path):
        try:
            shutil.rmtree(articles_dir_path)
            print(f"🗑️ Deleted local articles folder: {articles_dir_path}")
            return True
        except Exception as e:
            print(f"⚠️ Error deleting local articles folder: {e}")
            return False
    else:
        print(f"ℹ️ Local articles folder does not exist: "
              f"{articles_dir_path}")
        return True

def delete_old_articles_from_service(days_old=7):
    """Delete articles older than specified days from the articles service."""
    try:
        # Calculate timestamp for specified days ago
        cutoff_date = datetime.now() - timedelta(days=days_old)
        timestamp = cutoff_date.isoformat() + "Z"

        print(f"🔍 Starting batch processing of articles older than "
              f"{days_old} days...")

        # Fetch and delete in batches of 10
        total_deleted = 0
        total_failed = 0
        batch_count = 0

        while True:
            # Fetch 10 articles
            url = f"{ARTICLES_API_URL}/older-than/{timestamp}"
            params = {"limit": 10, "offset": 0}  # Always offset 0 since
                                                  # we're deleting
            response = requests.get(url, params=params)
            response.raise_for_status()
            articles = response.json()

            if not articles:
                print("ℹ️ No more articles found to delete")
                break

            batch_count += 1
            print(f"📋 Batch {batch_count}: Found {len(articles)} articles "
                  f"to delete")

            # Delete each article in this batch
            batch_deleted = 0
            batch_failed = 0

            for article in articles:
                article_id = (article.get("uuid") or article.get("id") or 
                             article.get("_id"))
                if article_id:
                    try:
                        delete_url = f"{ARTICLES_API_URL}/{article_id}"
                        delete_response = requests.delete(delete_url)
                        delete_response.raise_for_status()
                        batch_deleted += 1
                        total_deleted += 1
                        print(f"🗑️ Deleted: {article_id}")
                    except requests.exceptions.RequestException as e:
                        batch_failed += 1
                        total_failed += 1
                        print(f"⚠️ Error deleting {article_id}: {e}")
                else:
                    batch_failed += 1
                    total_failed += 1
                    print(f"⚠️ Article missing ID: {article}")

            print(f"✅ Batch {batch_count} complete: {batch_deleted} "
                  f"deleted, {batch_failed} failed")

            # If we got fewer articles than expected, we're done
            if len(articles) < 10:
                break

        print(f"🎉 Cleanup completed!")
        print(f"✅ Total deleted: {total_deleted} articles")
        if total_failed > 0:
            print(f"⚠️ Total failed: {total_failed} articles")

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error fetching old articles from service: {e}")
    except Exception as e:
        print(f"⚠️ Error processing old articles cleanup: {e}")

def main():
    days_old = 7
    if len(sys.argv) > 1:
        try:
            days_old = int(sys.argv[1])
        except ValueError:
            print("⚠️ Invalid number of days. Using default: 7 days")

    print(f"🚀 Starting cleanup of articles older than {days_old} days...")

    # Delete local articles folder
    print("📁 Cleaning up local articles folder...")
    delete_local_articles_folder()

    # Delete old articles from service
    print(f"🌐 Cleaning up articles older than {days_old} days from "
          f"service...")
    delete_old_articles_from_service(days_old)

    print("✅ Cleanup completed!")

if __name__ == "__main__":
    main()