import requests
import re
import os
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from concurrent.futures import ThreadPoolExecutor
import time
from dotenv import load_dotenv

BASE_URL = "https://help.ardoq.com"
START_URL = f"{BASE_URL}/en/"
ARTICLES_API_URL = "http://backend:8000/articles"
headers = {"User-Agent": "Mozilla/5.0"}

load_dotenv()
top_dir = os.environ.get("TOP_DIR")
articles_dir = os.environ.get("ARTICLES_DIR")
articles_dir_path = os.path.join(top_dir, articles_dir)
temp_dir_path = os.path.join(articles_dir_path, "temp")

visited = set()
queue = {START_URL}
os.makedirs(articles_dir_path, exist_ok=True)
os.makedirs(temp_dir_path, exist_ok=True)

def normalize_url(url):
    """Remove URL fragment to avoid duplicate processing of same page."""
    parsed = urlparse(url)
    return parsed._replace(fragment='').geturl()

def post_to_articles_service(title, url, content):
    """Posts article data to the MongoDB service and returns the UUID."""
    try:
        # API expects title and url as query parameters, content in body
        params = {
            "title": title,
            "url": url
        }
        payload = {
            "content": content
        }
        response = requests.post(ARTICLES_API_URL, params=params, 
                                json=payload, 
                                headers={"Content-Type": "application/json"})
        response.raise_for_status()
        result = response.json()
        uuid = result.get("id")  # API returns "id" field
        print(f"✅ Posted to articles service, UUID: {uuid}")
        return uuid
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error posting to articles service: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Error processing articles service response: {e}")
        return None

def download_and_process_page(url):
    """Downloads a page, saves its text content, posts to articles service, 
    and extracts new links from <a> tags."""
    normalized_url = normalize_url(url)
    if normalized_url in visited:
        return set()

    visited.add(normalized_url)
    print(f"🔍 Processing URL: {url}")
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract title from page
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else "Untitled"

        # Save the page content initially to temp folder
        parsed_url = urlparse(url)
        path_segments = [part for part in parsed_url.path.split("/") if part]
        temp_filename = (path_segments[-1].replace("-", "_")
                         .replace(":", "").replace("/", "_") 
                         if path_segments else "home")
        temp_filepath = os.path.join(temp_dir_path, f"{temp_filename}")

        text_content = soup.get_text("\n", strip=True)
        with open(temp_filepath, "w", encoding="utf-8") as f:
            f.write(text_content)
        print(f"✅ Saved page content to temp folder: {temp_filepath}")

        # Post to articles service
        uuid = post_to_articles_service(title, url, text_content)

        if uuid:
            # Move file from temp to main directory with UUID name
            uuid_filepath = os.path.join(articles_dir_path, f"{uuid}")
            os.rename(temp_filepath, uuid_filepath)
            print(f"📝 Moved file to main directory: {uuid_filepath}")
        else:
            # Leave the file in temp folder - it will be cleaned up before
            # embeddings
            print(f"⚠️ Failed to post to articles service, file left in "
                  f"temp: {temp_filepath}")

        # Extract new links from <a> tags
        new_links = set()
        for link_tag in soup.find_all("a", href=True):
            link = urljoin(url, link_tag["href"])
            parsed_link = urlparse(link)
            normalized_link = normalize_url(link)
            if (parsed_link.netloc == urlparse(BASE_URL).netloc and 
                normalized_link not in visited and 
                normalized_link not in queue):
                new_links.add(link)
                print(f"🔗 Found new link: {link}")
        return new_links

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error fetching {url}: {e}")
        return set()
    except Exception as e:
        print(f"⚠️ Error processing {url}: {e}")
        return set()

def main():
    print("🚀 Starting to collect and download page content...")

    with ThreadPoolExecutor(max_workers=5) as executor:
        while queue:
            current_url = queue.pop()
            future = executor.submit(download_and_process_page, current_url)
            newly_found_links = future.result()
            queue.update(newly_found_links)
            time.sleep(0.1)  # Be a bit gentler on the server

    print("✅ Finished! Attempted to download content from all "
          "discovered pages.")

if __name__ == "__main__":
    main()