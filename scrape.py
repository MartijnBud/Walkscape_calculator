import requests
from bs4 import BeautifulSoup
import pandas as pd
import re

""" Scrape tables from wiki page """
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
            # Skip empty tables
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

""" Function to make csv with all activities and recipes, scraped from walkscape wiki """
def get_activites():
    # Get list of Skills
    dfs = get_tables("https://wiki.walkscape.app/wiki/Skills")
    skills = dfs["other"][0]["Skill.1"]

    # Get df with all recipes and all activities
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

        for df in dfs["recipes"]:
            print(df)
            df["skill"] = skill


        # Merge the results into the combined_dfs dictionary
        for label in combined_dfs:
            combined_dfs[label].extend(dfs.get(label, []))

    df_recipes = pd.concat(combined_dfs["recipes"])
    df_activities = pd.concat(combined_dfs["activities"])

    # Clean recipes and activities before merging
    df_activities.rename(columns=str.lower)
    df_recipes.rename(columns=str.lower)

    df_activities.rename(columns={"level(s)": "level", "location": "location(s)", "activity.1": "activity",
                                  "skill(s)": "skill", "requirement(s)": "requirement"})
    df_recipes.rename(columns={"activity.1": "activity", "service requirement": "location",
                               "materials used": "requirement"})

    df_activities['Min Steps (Max Efficiency)'] = df_activities['Min Steps (Max Efficiency)'].str.replace(r'\s*\(.*?\)', '', regex=True)
    df_activities.columns = [re.sub(r'\s*\(.*?\)', '', col) for col in df_activities.columns]
    df_recipes['Min Steps (Max Efficiency)'] = df_recipes['Min Steps (Max Efficiency)'].str.replace(r'\s*\(.*?\)', '', regex=True)
    df_recipes.columns = [re.sub(r'\s*\(.*?\)', '', col) for col in df_recipes.columns]

    df_activities = df_activities.drop(df_activities.columns[:2], axis=1)
    df_recipes = df_recipes.drop(df_recipes.columns[:2], axis=1)


    df_recipes.to_csv("data/recipes.csv")
    df_activities.to_csv("data/activities.csv")

get_activites()