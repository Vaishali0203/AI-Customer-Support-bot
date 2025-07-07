import os
import json
import time
from urllib.parse import urlparse, urljoin
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from bs4 import BeautifulSoup
import requests

BASE_URL = "https://help.ardoq.com"
START_URL = f"{BASE_URL}/en/"
ARTICLES_API_URL = "http://backend:8000/articles"

load_dotenv()
top_dir = os.environ.get("TOP_DIR")
articles_dir = os.environ.get("ARTICLES_DIR")
articles_dir_path = os.path.join(top_dir, articles_dir)
temp_dir_path = os.path.join(articles_dir_path, "temp")

visited = set()
queue = {START_URL}
os.makedirs(articles_dir_path, exist_ok=True)
os.makedirs(temp_dir_path, exist_ok=True)


def create_webdriver():
    """Creates a headless Chromium WebDriver instance."""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--disable-features=VizDisplayCompositor")
    
    # Use system chromium binary and driver
    chrome_options.binary_location = "/usr/bin/chromium"
    
    try:
        driver = webdriver.Chrome(
            options=chrome_options,
            service=webdriver.ChromeService(executable_path="/usr/bin/chromedriver")
        )
        driver.implicitly_wait(10)
        return driver
    except WebDriverException as e:
        print(f"⚠️ Error creating WebDriver: {e}")
        return None


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
    """Downloads a page using Selenium, saves its text content, posts to 
    articles service, and extracts new links from <a> tags."""
    normalized_url = normalize_url(url)
    if normalized_url in visited:
        return set()

    visited.add(normalized_url)
    print(f"🔍 Processing URL: {url}")
    
    driver = create_webdriver()
    if not driver:
        print(f"⚠️ Failed to create WebDriver for {url}")
        return set()
    
    try:
        # Load the page
        driver.get(url)
        
        # Wait for page to load (adjust timeout as needed)
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
        except TimeoutException:
            print(f"⚠️ Timeout waiting for page to load: {url}")
            return set()
        
        # Give JavaScript a moment to render content
        time.sleep(2)
        
        # Get page source after JavaScript execution
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, "html.parser")

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

    except WebDriverException as e:
        print(f"⚠️ WebDriver error processing {url}: {e}")
        return set()
    except Exception as e:
        print(f"⚠️ Error processing {url}: {e}")
        return set()
    finally:
        # Always clean up the driver
        if driver:
            driver.quit()


def main():
    print("🚀 Starting to collect and download page content using Selenium...")
    
    # Process pages sequentially to avoid overwhelming the server with 
    # multiple browser instances
    processed_count = 0
    while queue:
        current_url = queue.pop()
        newly_found_links = download_and_process_page(current_url)
        queue.update(newly_found_links)
        processed_count += 1
        
        # Be gentle on the server and system resources
        time.sleep(1)
        
        # Log progress
        if processed_count % 10 == 0:
            print(f"📊 Processed {processed_count} pages, "
                  f"{len(queue)} remaining in queue")

    print("✅ Finished! Attempted to download content from all "
          "discovered pages using Selenium.")


if __name__ == "__main__":
    main()