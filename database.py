import sqlite3
from datetime import datetime

from config import (
    DATABASE_FOLDER,
    DATABASE_PATH
)


def get_connection():

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    import os

    os.makedirs(
        DATABASE_FOLDER,
        exist_ok=True
    )

    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS food_history (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            food_name TEXT NOT NULL,

            quantity REAL NOT NULL,

            calories REAL NOT NULL,

            protein REAL NOT NULL,

            carbs REAL NOT NULL,

            fat REAL NOT NULL,

            confidence REAL DEFAULT 0,

            meal_date TEXT NOT NULL,

            meal_time TEXT NOT NULL

        )
    """)

    connection.commit()

    connection.close()


def add_food(
    food_name,
    quantity,
    calories,
    protein,
    carbs,
    fat,
    confidence=0
):

    now = datetime.now()

    connection = get_connection()

    connection.execute("""
        INSERT INTO food_history
        (
            food_name,
            quantity,
            calories,
            protein,
            carbs,
            fat,
            confidence,
            meal_date,
            meal_time
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (

        food_name,
        quantity,
        calories,
        protein,
        carbs,
        fat,
        confidence,

        now.strftime("%Y-%m-%d"),

        now.strftime("%I:%M %p")

    ))

    connection.commit()

    connection.close()


def get_today_foods():

    today = datetime.now().strftime(
        "%Y-%m-%d"
    )

    connection = get_connection()

    rows = connection.execute("""
        SELECT *
        FROM food_history
        WHERE meal_date = ?
        ORDER BY id DESC
    """, (today,)).fetchall()

    connection.close()

    return [
        dict(row)
        for row in rows
    ]


def get_today_summary():

    foods = get_today_foods()

    consumed = sum(
        item["calories"]
        for item in foods
    )

    protein = sum(
        item["protein"]
        for item in foods
    )

    carbs = sum(
        item["carbs"]
        for item in foods
    )

    fat = sum(
        item["fat"]
        for item in foods
    )

    return {
        "consumed": round(consumed, 1),
        "protein": round(protein, 1),
        "carbs": round(carbs, 1),
        "fat": round(fat, 1),
        "foods": foods
    }