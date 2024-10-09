
import requests
import os
from bs4 import BeautifulSoup


""" Get BeautifulSoup object of Walkscape Wiki page """
def get_wiki_soup(page = ""):
    url = "https://wiki.walkscape.app/wiki/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    response = requests.get(url + page, headers=headers).text
    soup = BeautifulSoup(response, "html.parser")

    return soup

""" Gets all useful tables from wiki page using soup object """
def get_tables(soup):
    tables = soup.find_all("table")
    tables_list = []
    for table in tables:

        if not table.find('tr'):
            # Skip empty tables
            continue

        if "This page has been updated to reflect" in table.find("tr").text:
            # Skipping useless table
            continue

        if "This page is updated automatically" in table.find("tr").text:
            # Skipping useless table
            continue

        tables_list.append(table)

    return tables_list

""" Writes all svg from table """
def download_svg_from_table(table, destination_path):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

    os.makedirs(destination_path, exist_ok=True)
    rows = table.find_all("tr")
    for row in rows:
        img_tag = row.find("img")
        if not img_tag:
            continue

        img_url = img_tag["src"]
        filename = img_url.split("/")[-1]
        extension = filename.split(".")[-1]
        filename = filename.replace("%27", "'")
        filename = filename.replace("%28", "(")
        filename = filename.replace("%29", ")")
        filename = filename.replace("_", " ")
        print(filename)
        img_url = "https:" + img_url

        if extension == "svg":
            svg = requests.get(img_url, headers=headers).text
            with open(destination_path + filename, 'w') as file:
                file.write(svg)

        if extension == "png":
            response = requests.get(img_url, headers=headers, stream=True)
            with open(os.path.join(destination_path, filename), 'wb') as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)

def get_previous_headers(table):
    h2_header = None
    h3_header = None

    sibling = table.find_previous_sibling()
    while sibling:
        if sibling.name == 'h2' and h2_header is None:
            h2_header = sibling.get_text(strip=True)
        elif sibling.name == 'h3' and h3_header is None:
            h3_header = sibling.get_text(strip=True)

        # Move to the previous sibling
        sibling = sibling.find_previous_sibling()

        # Stop if both headers are found
        if h2_header and h3_header:
            break

    return h2_header, h3_header

def split_br(p):
    lines = []
    current_line = []
    for content in p.contents:
        if content.name == 'br':
            # If we encounter a <br />, join the current line and add it to lines
            if current_line:
                lines.append(BeautifulSoup(''.join(str(x) for x in current_line), 'html.parser'))
                current_line = []  # Reset current line
        else:
            # Otherwise, add the content to the current line
            current_line.append(content)
    # Add any remaining content after the last <br />
    if current_line:
        lines.append(BeautifulSoup(''.join(str(x) for x in current_line), 'html.parser'))

    return lines

def get_attributes_from_html(lines):
    results = []

    for section in lines:
        plus_spans = section.find_all('span', style="color:#228B22")
        sub_spans = section.find_all('span', style="color:#E51414")

        if isinstance(plus_spans, str):
            plus_spans = [plus_spans]  # Convert to a list if it's a string
        if isinstance(sub_spans, str):
            sub_spans = [sub_spans]  # Convert to a list if it's a string

        # Combine both sets of spans
        spans = plus_spans + sub_spans

        if not spans:
            continue

        for span in spans:
            attribute = span.text.strip()
            remaining_text = section.text.strip()
            note = remaining_text.replace(attribute, '').strip()
            results.append({"attribute": attribute, "note": note})

    return results