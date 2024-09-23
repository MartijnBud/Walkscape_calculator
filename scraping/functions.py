
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