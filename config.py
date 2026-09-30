import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DATABASE_FOLDER = os.path.join(BASE_DIR, "database")
DATABASE_PATH = os.path.join(DATABASE_FOLDER, "food_history.db")
FOOD_DATA_PATH = os.path.join(BASE_DIR, "data", "food_data.csv")

DAILY_CALORIE_TARGET = 2000

MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}