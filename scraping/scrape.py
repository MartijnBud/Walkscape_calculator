
from bs4 import BeautifulSoup
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

    # Get activities and skills, and their icons
    for table in tables:
        df = pd.read_html(str(table), flavor='bs4')[0]
        name = df.columns[0].lower()
        # func.download_svg_from_table(table, f"data/images/{name}/")

        if name == "skill": skills = list(df["Skill.1"])
        if name == "activity": activities = list(df["Activity.1"])

    print(f"Activities: {activities}")
    print(f"Skills: {skills}")

    # Get all information of activities (exp, loot)
    for activity in activities:
        soup = func.get_wiki_soup(activity)
        tables = func.get_tables(soup)

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


def get_attributes_crafted(df):
    qualities = ["Normal", "Good", "Great", "Excellent", "Perfect", "Eternal"]
    new_rows = []

    for index, row in df.iterrows():
        item = row['Item']
        print(f"Get data for {item}")
        soup = func.get_wiki_soup(item)
        tables = func.get_tables(soup)
        table = tables[12]  # Adjust if necessary

        paragraphs = table.find_all('p')
        quality_index = 0

        for p in paragraphs:

            if "This item has no attributes" in p.text.strip():
                # Filler for items that have no attribute
                for quality in qualities:
                    new_rows.append({
                        'Item': item,
                        'Skill_req': row['Skill_req'],
                        'Level': row['Level'],
                        'Slot': row['Slot'],
                        'Craft_loot': row['Craft_loot'],
                        'Quality': quality,
                        'Item_type': row['Item_type'],
                        'Attribute': None,
                        'Boost': None,
                        'Type_boost': None,
                        'Skill_boost': None,
                        'Note': None
                    })
                break

            # print(f"Getting quality {qualities[quality_index]}")
            lines = func.split_br(p)
            quality_index += 1
            results_from_p = func.get_attributes_from_html(lines)
            for result in results_from_p:
                # Extracting useful information from attribute
                attribute_full = result.get('attribute')
                attribute_list = attribute_full.split(" ")

                boost = attribute_list[0].replace('+', '').replace('%', '')
                type_boost = "Percentage" if "%" in attribute_full else "Flat"
                attribute = ' '.join(attribute_list[1:]).strip()
                note = result.get('note')
                skill_boost = note.split(" ")[-1] if "While doing" in note or note.split(" ")[-1] == "Global" else ""

                new_rows.append({
                    'Item': item,
                    'Skill_req': row['Skill_req'],
                    'Level': row['Level'],
                    'Slot': row['Slot'],
                    'Craft_loot': row['Craft_loot'],
                    'Quality': qualities[quality_index - 1],
                    'Item_type': row['Item_type'],
                    'Attribute': attribute,
                    'Boost': boost,
                    'Type_boost': type_boost,
                    'Skill_boost': skill_boost,
                    'Note': note
                })

    return new_rows

def get_attributes_loot(df):
    new_rows = []

    for index, row in df.iterrows():
        item = row['Item']
        print(f"Get data for {item}")
        soup = func.get_wiki_soup(item)
        span_attribute = soup.find('span', {'class': 'mw-headline', 'id': 'Item_Attributes'})
        if not span_attribute: span_attribute = soup.find('span', {'class': 'mw-headline', 'id': 'Attributes'})
        h2 = span_attribute.find_parent('h2')
        p_attribute = h2.find_next_sibling()

        lines = func.split_br(p_attribute)
        results_from_p = func.get_attributes_from_html(lines)

        for result in results_from_p:
            # Extracting useful information from attribute
            attribute_full = result.get('attribute')
            attribute_list = attribute_full.split(" ")

            boost = attribute_list[0].replace('+', '').replace('%', '')
            type_boost = "Percentage" if "%" in attribute_full else "flat"
            attribute = ' '.join(attribute_list[1:]).strip()
            note = result.get('note')
            skill_boost = note.split(" ")[-1] if "While doing" in note or note.split(" ")[-1] == "Global" else ""

            new_rows.append({
                'Item': item,
                'Skill_req': row['Skill_req'],
                'Level': row['Level'],
                'Slot': row['Slot'],
                'Craft_loot': row['Craft_loot'],
                'Quality': None,
                'Item_type': row['Item_type'],
                'Attribute': attribute,
                'Boost': boost,
                'Type_boost': type_boost,
                'Skill_boost': skill_boost,
                'Note': note
            })

    return new_rows

def get_equipment():
    soup = func.get_wiki_soup("Equipment")
    tables = func.get_tables(soup)

    columns = ['Item', 'Skill_req', 'Level', 'Slot', 'Craft_loot', 'Quality', 'Item_type', 'Attribute', 'Boost',
               'Type_boost', 'Skill_boost', 'Note']
    df = pd.DataFrame(columns=columns)

    for table in tables:

        temp_df = pd.DataFrame(columns=columns)

        # Get if gear or tool, and crafted or loot
        gear_tool, craft_loot = func.get_previous_headers(table)
        df_table = pd.read_html(str(table), flavor='bs4')[0]
        items = df_table.iloc[:,1]

        # Get easy accessed columns (item name, skill, level, slot/tool, item type)
        temp_df["Item"] = items
        temp_df["Skill_req"] = df_table[df_table.columns[2]]
        temp_df["Level"] = df_table[df_table.columns[3]]
        temp_df["Slot"] = df_table["Slot"] if "Slot" in df_table.columns else "Tool"
        temp_df["Item_type"] = df_table["Item Type"]
        temp_df["Craft_loot"] = "Craft" if "Crafted" in craft_loot else "Loot"

        df = pd.concat([temp_df, df], ignore_index=True)


    # Now get all attributes
    ## Collect all attributes of loot items
    df_loot = df[df["Craft_loot"] == "Loot"]
    new_rows_tool = get_attributes_loot(df_loot)

    ## Collect all attributes of crafted items
    df_craft = df[df["Craft_loot"] == "Craft"]
    new_rows_crafted = get_attributes_crafted(df_craft)

    new_rows = new_rows_tool + new_rows_crafted

    # Write csv
    new_rows_df = pd.DataFrame(new_rows)
    df = df[~df['Item'].isin(new_rows_df['Item'])]
    df = pd.concat([df, new_rows_df], ignore_index=True)
    df.to_csv("equipment_with_qualities.csv", index=False)








get_equipment()

