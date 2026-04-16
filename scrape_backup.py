import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def download_site(url, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        response = requests.get(url)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching main page: {e}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Save index.html
    with open(os.path.join(output_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("Saved index.html")

    # Find static assets
    tags = {
        'link': 'href',
        'script': 'src',
        'img': 'src'
    }

    for tag, attr in tags.items():
        for element in soup.find_all(tag):
            asset_url = element.get(attr)
            if not asset_url:
                continue

            full_url = urljoin(url, asset_url)
            # Only download if it's from the same domain
            if urlparse(full_url).netloc == urlparse(url).netloc:
                relative_path = urlparse(full_url).path.lstrip('/')
                if not relative_path: continue
                
                dest_path = os.path.join(output_dir, relative_path)
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)

                try:
                    asset_response = requests.get(full_url)
                    if asset_response.status_code == 200:
                        with open(dest_path, 'wb') as f:
                            f.write(asset_response.content)
                        print(f"Downloaded: {relative_path}")
                except Exception as e:
                    print(f"Failed to download {asset_url}: {e}")

if __name__ == "__main__":
    target = "https://smaatechengineering.com/"
    folder = "backup_live_site"
    print(f"Starting backup of {target}...")
    download_site(target, folder)
    print("Backup complete locally.")
