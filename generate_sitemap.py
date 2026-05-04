import os
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from xml.dom import minidom

BASE_URL = "https://ohaswin.com"
ROOT_DIR = "."
OUTPUT_FILE = "sitemap.xml"

# Directories and files to exclude
EXCLUDE_DIRS = {".git", ".vscode", ".venv", "assets", "media"}
EXCLUDE_FILES = {"404.html", "google170b92e9a870bc39.html", "base.html", "test.html"}

def generate_sitemap():
    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    for root, dirs, files in os.walk(ROOT_DIR):
        # Modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            if not file.endswith(".html"):
                continue
            
            if file in EXCLUDE_FILES:
                continue
                
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, ROOT_DIR)
            
            # Convert Windows path to URL path format
            rel_path = rel_path.replace("\\", "/")
            
            # Format the URL path
            if rel_path == "index.html":
                url_path = ""
            elif rel_path.endswith("/index.html"):
                url_path = rel_path[:-10] # remove index.html
            else:
                url_path = rel_path
                
            full_url = f"{BASE_URL}/{url_path}"
            
            # Get last modified time
            mtime = os.path.getmtime(file_path)
            lastmod = datetime.fromtimestamp(mtime, tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%S+00:00')
            
            # Create URL element
            url = ET.SubElement(urlset, "url")
            loc = ET.SubElement(url, "loc")
            loc.text = full_url
            
            lastmod_elem = ET.SubElement(url, "lastmod")
            lastmod_elem.text = lastmod
            
            # Add optional priority based on depth or specific paths
            priority_elem = ET.SubElement(url, "priority")
            if url_path == "":
                priority_elem.text = "1.0"
            elif url_path.split("/")[0] in ["projects", "about", "blog"]:
                priority_elem.text = "0.8"
            else:
                priority_elem.text = "0.6"

    # Pretty print the XML
    xml_str = ET.tostring(urlset, 'utf-8')
    parsed_xml = minidom.parseString(xml_str)
    pretty_xml = parsed_xml.toprettyxml(indent="  ")

    # Remove blank lines from minidom output
    pretty_xml = '\n'.join([line for line in pretty_xml.split('\n') if line.strip()])

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        # Skip the xml declaration from minidom since we wrote our own
        f.write(pretty_xml[pretty_xml.find('<urlset'):])

    print(f"Successfully generated {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_sitemap()
