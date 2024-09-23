
import pandas as pd
import re
import os
import functions as func

""" Scrape tables from wiki page """
def get_activity_tables(url):
    soup = func.get_wiki_soup()
    tables = func.get_tables(soup)

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

def activities_recipes():
    soup = func.get_wiki_soup("Activities")
    tables = func.get_tables(soup)

    for table in tables:
        df = pd.read_html(str(table), flavor='bs4')[0]
        name = df.columns[0].lower()
        func.download_svg_from_table(table, f"data/images/{name}/")


activities_recipes()








""" Function to make csv with all activities and recipes, scraped from walkscape wiki """
def get_activites():
    # Get list of Skills
    dfs = get_activity_tables("https://wiki.walkscape.app/wiki/Skills")
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
        dfs = get_activity_tables(path_skill)

        # Adding empty columns for eventual merging
        for df in dfs["recipes"]:
            print(df)
            df["Category"] = "recipe"
            df["Skill"] = skill
            df["Location"] = "-"

        for df in dfs["activities"]:
            df["Category"] = "activity"
            df["Materials Used"] = "-"

        # Merge the results into the combined_dfs dictionary
        for label in combined_dfs:
            combined_dfs[label].extend(dfs.get(label, []))

    df_recipes = pd.concat(combined_dfs["recipes"])
    df_activities = pd.concat(combined_dfs["activities"])

    # Clean recipes and activities before merging
    ## Dropping empty columns
    df_activities.drop(df_activities.columns[0], axis=1, inplace=True)
    df_recipes.drop(df_recipes.columns[0], axis=1, inplace=True)

    ## Removing () and .
    df_activities.columns = [re.sub(r"\(.*?\)|\..*", "", col).strip() for col in df_activities.columns]
    df_recipes.columns = [re.sub(r"\(.*?\)|\..*", "", col).strip() for col in df_recipes.columns]

    df_activities['Min Steps'] = df_activities['Min Steps'].str.replace(r'\s*\(.*?\)', '', regex=True)
    df_recipes['Min Steps'] = df_recipes['Min Steps'].str.replace(r'\s*\(.*?\)', '', regex=True)

    ## Merging columns that should never been separate columns ...
    df_recipes['Base Exp/Step'] = df_recipes['Base Exp/Step'].fillna(df_recipes['Exp/Step'])

    ## Dropping unnecessary columns
    df_activities.drop(["Max Exp/Step", "Base Total Exp/Step", "Total Max Exp/Step"], axis=1, inplace=True)
    df_recipes.drop(["Max Exp/Step", "Note", "Exp/Step"], axis=1, inplace=True)

    ## Rename 'Service Requirement' or 'Requirement' for recipes
    df_recipes.rename(columns={"Service Requirement": "Requirement"}, inplace=True)

    df = pd.concat([df_recipes, df_activities])
    df.to_csv("data/activities.csv", index=False)

def get_equipment_images(destination_path):
    soup = func.get_wiki_soup("Equipment")
    tables = func.get_tables(soup)

    items = set()
    os.makedirs(destination_path, exist_ok=True)

    # Get equipment names
    for table in tables:

        df = pd.read_html(str(table), flavor='bs4')[0]
        items.update(df["Item.1"])

        # Find and download images in each row
        func.download_svg_from_table(table, destination_path)




def get_activities_images():
    soup = func.get_wiki_soup("Activities")
    tables = func.get_tables(soup)

    items = set()
    os.makedirs("data/images/activities", exist_ok=True)

    # Get equipment names
    for table in tables:

        df = pd.read_html(str(table), flavor='bs4')[0]
        items.update(df["Item.1"])

        # Find and download images in each row
        func.download_svg_from_table(table, "data/images/activities")

