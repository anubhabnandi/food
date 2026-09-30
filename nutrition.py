import pandas as pd
from config import FOOD_DATA_PATH


def load_food_data():

    df = pd.read_csv(FOOD_DATA_PATH)

    df["food"] = (
        df["food"]
        .astype(str)
        .str.lower()
        .str.strip()
    )

    return df


FOOD_DF = load_food_data()


def normalize_food_name(name):

    return (
        str(name)
        .lower()
        .strip()
    )


def find_food(food_name):

    food_name = normalize_food_name(food_name)

    # Exact match
    exact = FOOD_DF[
        FOOD_DF["food"] == food_name
    ]

    if not exact.empty:
        return exact.iloc[0].to_dict()

    # Partial match
    partial = FOOD_DF[
        FOOD_DF["food"].str.contains(
            food_name,
            case=False,
            na=False
        )
    ]

    if not partial.empty:
        return partial.iloc[0].to_dict()

    # Reverse partial match
    for _, row in FOOD_DF.iterrows():

        if row["food"] in food_name:
            return row.to_dict()

    return None


def calculate_nutrition(food_name, quantity_grams):

    food = find_food(food_name)

    if food is None:
        return None

    quantity_grams = float(quantity_grams)

    multiplier = quantity_grams / 100

    return {
        "food": food["food"].title(),

        "quantity": round(
            quantity_grams,
            1
        ),

        "calories": round(
            food["calories"] * multiplier,
            1
        ),

        "protein": round(
            food["protein"] * multiplier,
            1
        ),

        "carbs": round(
            food["carbs"] * multiplier,
            1
        ),

        "fat": round(
            food["fat"] * multiplier,
            1
        )
    }


def search_foods(query):

    query = normalize_food_name(query)

    if not query:
        return []

    matches = FOOD_DF[
        FOOD_DF["food"].str.contains(
            query,
            case=False,
            na=False
        )
    ]

    return matches["food"].str.title().tolist()