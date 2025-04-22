import requests
import re
import os
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from concurrent.futures import ThreadPoolExecutor
import time

BASE_URL = "https://help.ardoq.com"
START_URL = f"{BASE_URL}/en/"
headers = {"User-Agent": "Mozilla/5.0"}

visited = set()
queue = {START_URL}
os.makedirs("articles", exist_ok=True)

def download_and_process_page(url):
    """Downloads a page, saves its text content, and extracts new links from <a> tags (ignoring URL fragments for filenames)."""
    if url in visited:
        return set()

    visited.add(url)
    print(f"🔍 Processing URL: {url}")
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Save the page content, ignoring the fragment in the filename
        parsed_url = urlparse(url)
        path_segments = [part for part in parsed_url.path.split("/") if part]
        title = path_segments[-1].replace("-", "_").replace(":", "").replace("/", "_") if path_segments else "home"
        filepath = os.path.join("articles", f"{title}.txt")
        text_content = soup.get_text("\n", strip=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(text_content)
        print(f"✅ Saved page content: {filepath}")

        # Extract new links from <a> tags
        new_links = set()
        for link_tag in soup.find_all("a", href=True):
            link = urljoin(url, link_tag["href"])
            parsed_link = urlparse(link)
            if parsed_link.netloc == urlparse(BASE_URL).netloc and link not in visited and link not in queue:
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

    print("✅ Finished! Attempted to download content from all discovered pages.")

if __name__ == "__main__":
    main()