import requests
from bs4 import BeautifulSoup
import logging
from typing import Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

def fetch_and_extract_text(url: str, max_chars: int = 3000) -> Optional[str]:
    """
    Safely fetches a website and extracts its text content, title, and description.
    Returns None if the site cannot be reached or blocks the scraper.
    """
    if not url.startswith("http"):
        url = "https://" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        logger.info(f"Deep OSINT: Attempting to scrape {url}")
        # Use a short timeout so we don't hang the API
        response = requests.get(url, headers=headers, timeout=4.0)
        
        # If we hit a 403 or 401, they are probably blocking scrapers
        if response.status_code != 200:
            logger.warning(f"Deep OSINT: Scrape failed with status {response.status_code}")
            return None
            
        # Ensure it's HTML
        content_type = response.headers.get("Content-Type", "")
        if "text/html" not in content_type.lower():
            logger.info("Deep OSINT: URL does not point to an HTML page.")
            return None

        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract Title
        title = soup.title.string.strip() if soup.title and soup.title.string else "No Title"
        
        # Extract Meta Description
        meta_desc = ""
        desc_tag = soup.find("meta", attrs={"name": "description"})
        if desc_tag and desc_tag.get("content"):
            meta_desc = desc_tag["content"].strip()
            
        # Kill script and style elements
        for script in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            script.extract()
            
        # Extract visible text
        text = soup.get_text(separator=" ", strip=True)
        
        # Remove extra whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        visible_text = " ".join(chunk for chunk in chunks if chunk)
        
        # Build the final payload
        scraped_content = f"Title: {title}\n"
        if meta_desc:
            scraped_content += f"Meta Description: {meta_desc}\n"
        
        scraped_content += f"Visible Text:\n{visible_text}"
        
        # Truncate to save tokens and prevent massive inputs
        if len(scraped_content) > max_chars:
            scraped_content = scraped_content[:max_chars] + "...[TRUNCATED]"
            
        logger.info(f"Deep OSINT: Successfully scraped {len(scraped_content)} characters.")
        return scraped_content

    except requests.exceptions.Timeout:
        logger.warning(f"Deep OSINT: Scrape timeout for {url}")
        return None
    except requests.exceptions.RequestException as e:
        logger.warning(f"Deep OSINT: Request failed for {url} - {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Deep OSINT: Unexpected error scraping {url} - {str(e)}")
        return None
