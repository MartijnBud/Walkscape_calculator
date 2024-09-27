
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


def get_equipment(destination_path):
    soup = func.get_wiki_soup("Equipment")
    tables = func.get_tables(soup)

    columns = ['item', 'skill', 'level', 'slot', 'quality', 'item_type', 'attribute', "note", 'craft_loot']
    df = pd.DataFrame(columns=columns)

    os.makedirs(destination_path, exist_ok=True)

    for table in tables:

        temp_df = pd.DataFrame(columns=columns)

        # Get if gear or tool, and crafted or loot
        gear_tool, craft_loot = get_previous_headers(table)
        df_table = pd.read_html(str(table), flavor='bs4')[0]
        items = df_table.iloc[:,1]

        # Get easy accessed columns (item name, skill, level, slot/tool, item type)
        temp_df["item"] = items
        temp_df["skill"] = df_table[df_table.columns[2]]
        temp_df["level"] = df_table[df_table.columns[3]]
        temp_df["slot"] = df_table["Slot"] if "Slot" in df_table.columns else "Tool"
        temp_df["item_type"] = df_table["Item Type"]
        temp_df["craft_loot"] = "Craft" if craft_loot == "Crafted Items" else "Loot"

        df = pd.concat([temp_df, df], ignore_index=True)

    df.to_csv("equipment_without_qualities.csv", index=False)

    # Get attributes from qualities in gear

    qualities = ["Normal", "Good", "Great", "Excellent", "Perfect", "Eternal"]
    # Create a list to hold new rows
    new_rows = []

    df_craft = df[df["craft_loot"] == "Craft"]
    count = 0

    # Iterate over each row in the DataFrame
    for index, row in df_craft.iterrows():
        item = row['item']
        print(f"Get data for {item}")
        soup = func.get_wiki_soup(item)
        tables = func.get_tables(soup)
        table = tables[12]  # Adjust if necessary

        paragraphs = table.find_all('p')
        quality_index = 0

        for p in paragraphs:
            if "This item has no attributes" in p.text.strip():
                for quality in qualities:
                    new_rows.append({
                        'item': item,
                        'skill': row['skill'],
                        'level': row['level'],
                        'slot': row['slot'],
                        'quality': quality,
                        'item_type': row['item_type'],
                        'attributes': None,  # No attribute if it doesn't exist
                        'note': None,        # No note if it doesn't exist
                        'craft_loot': row['craft_loot']
                    })
                continue

            # print(f"Getting quality {qualities[quality_index]}")
            lines = split_br(p)  # Your function for splitting lines
            quality_index += 1
            results_from_p = get_attributes_from_html(lines)  # Your function for extracting attributes
            for result in results_from_p:
                new_rows.append({
                    'item': item,
                    'skill': row['skill'],
                    'level': row['level'],
                    'slot': row['slot'],
                    'quality': qualities[quality_index - 1],
                    'item_type': row['item_type'],
                    'attributes': result.get('attribute'),  # Extracting the attribute
                    'note': result.get('note'),
                    'craft_loot': row['craft_loot']
                })

        if count == 5:
            # Convert the new rows into a DataFrame
            new_rows_df = pd.DataFrame(new_rows)

            # Remove all rows in df for items that are in new_rows_df
            df = df[~df['item'].isin(new_rows_df['item'])]

            # Append the new rows for the items with qualities
            df = pd.concat([df, new_rows_df], ignore_index=True)

            # Save the final DataFrame with qualities to a CSV
            df.to_csv("equipment_with_qualities.csv", index=False)
            quit()

        count += 1






get_equipment("data/kaas")

