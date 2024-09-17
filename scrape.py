import requests
from bs4 import BeautifulSoup
import pandas as pd


def get_tables(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    response = requests.get(url, headers=headers).text

    soup = BeautifulSoup(response, "html.parser")
    tables = soup.find_all("table")

    labeled_dfs = {
        'recipes': [],
        'activities': [],
        'other': []}
    for table in tables:
        if not table.find('tr'):
            # Skip tables with no rows
            continue

        if "This page has been updated to reflect" in table.find("tr").text:
            # Skipping useless table
            continue

        # Extract and clean caption
        caption = table.find('caption')
        caption_text = caption.get_text(strip=True) if caption else "No caption"
        print(caption_text)

        # Determine the label
        if 'recipe' in caption_text.lower():
            label = 'recipes'
        elif 'activities' in caption_text.lower() and 'recipe' not in caption_text.lower():
            label = 'activities'
        else:
            label = 'other'
        print(label)
        try:
            df = pd.read_html(str(table), flavor='bs4')[0]
            labeled_dfs[label].append(df)
        except ValueError:
            print(f"Error converting table with caption '{caption_text}' to DataFrame")

    return labeled_dfs


# Use Skills table from Skills page to extract skills
dfs = get_tables("https://wiki.walkscape.app/wiki/Skills")
skills = dfs["other"][0]["Skill.1"]

# Get table with activities per skill
path = "https://wiki.walkscape.app/wiki/"

combined_dfs = {
    'recipes': [],
    'activities': [],
    'other': []
}

for skill in skills:
    print(f"Getting activity of {skill}")
    path_skill = path + skill
    dfs = get_tables(path_skill)

    # Merge the results into the combined_dfs dictionary
    for label in combined_dfs:
        combined_dfs[label].extend(dfs.get(label, []))

df_recipes = pd.concat(combined_dfs["recipes"])
df_activities = pd.concat(combined_dfs["activities"])

df_recipes.to_csv("data/recipes.csv")
df_activities.to_csv("data/activities.csv")