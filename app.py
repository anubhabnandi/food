from flask import (
    Flask,
    request,
    jsonify,
    render_template
)

import os
import uuid
from PIL import Image

from model import predict_food

from nutrition import (
    calculate_nutrition,
    find_food,
    search_foods
)

from database import (
    initialize_database,
    add_food,
    get_today_summary
)

from config import (
    UPLOAD_FOLDER,
    DAILY_CALORIE_TARGET,
    MAX_CONTENT_LENGTH,
    ALLOWED_EXTENSIONS
)


app = Flask(__name__)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

initialize_database()


def allowed_file(filename):

    if "." not in filename:
        return False

    extension = (
        filename.rsplit(".", 1)[1]
        .lower()
    )

    return extension in ALLOWED_EXTENSIONS


@app.route("/")
def home():

    return render_template(
        "index.html"
    )


@app.route("/search", methods=["POST"])
def search():

    data = request.get_json(
        silent=True
    ) or {}

    query = data.get(
        "food",
        ""
    ).strip()

    if not query:

        return jsonify({
            "success": False,
            "message": "Please enter a food name."
        })

    food = find_food(query)

    if food:

        return jsonify({

            "success": True,

            "food": food["food"].title(),

            "calories": food["calories"],

            "protein": food["protein"],

            "carbs": food["carbs"],

            "fat": food["fat"]

        })

    matches = search_foods(query)

    return jsonify({

        "success": False,

        "matches": matches,

        "message": "Food not found."

    })


@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:

        return jsonify({
            "success": False,
            "message": "No image was uploaded."
        }), 400

    image = request.files["image"]

    if image.filename == "":

        return jsonify({
            "success": False,
            "message": "Please select an image."
        }), 400

    if not allowed_file(image.filename):

        return jsonify({
            "success": False,
            "message":
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        }), 400

    extension = (
        image.filename
        .rsplit(".", 1)[1]
        .lower()
    )

    filename = (
        str(uuid.uuid4())
        + "."
        + extension
    )

    filepath = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )

    try:

        image.save(filepath)

        # Validate image
        with Image.open(filepath) as img:

            img.verify()

        # AI prediction
        food_name, confidence = predict_food(
            filepath
        )

        # Nutrition lookup
        nutrition = calculate_nutrition(
            food_name,
            100
        )

        if nutrition is None:

            return jsonify({

                "success": True,

                "food": food_name.title(),

                "confidence": confidence,

                "nutrition_available": False,

                "message":
                "Food recognized, but nutrition data is not available for this food."

            })

        return jsonify({

            "success": True,

            "food": food_name.title(),

            "confidence": confidence,

            "nutrition_available": True,

            "calories_per_100g":
            nutrition["calories"],

            "protein_per_100g":
            nutrition["protein"],

            "carbs_per_100g":
            nutrition["carbs"],

            "fat_per_100g":
            nutrition["fat"]

        })

    except Exception as e:

        return jsonify({

            "success": False,

            "message":
            "Unable to analyze this image."

        }), 500

    finally:

        # Delete uploaded image after processing
        if os.path.exists(filepath):

            try:
                os.remove(filepath)
            except:
                pass


@app.route("/calculate", methods=["POST"])
def calculate():

    data = request.get_json(
        silent=True
    ) or {}

    food_name = data.get(
        "food",
        ""
    )

    quantity = data.get(
        "quantity",
        100
    )

    try:

        quantity = float(quantity)

        if quantity <= 0:
            raise ValueError

    except:

        return jsonify({

            "success": False,

            "message":
            "Quantity must be greater than zero."

        }), 400

    result = calculate_nutrition(
        food_name,
        quantity
    )

    if result is None:

        return jsonify({

            "success": False,

            "message":
            "Nutrition data not available."

        }), 404

    return jsonify({

        "success": True,

        **result

    })


@app.route("/add", methods=["POST"])
def add():

    data = request.get_json(
        silent=True
    ) or {}

    try:

        food_name = data["food"]

        quantity = float(
            data["quantity"]
        )

        calories = float(
            data["calories"]
        )

        protein = float(
            data["protein"]
        )

        carbs = float(
            data["carbs"]
        )

        fat = float(
            data["fat"]
        )

        confidence = float(
            data.get(
                "confidence",
                0
            )
        )

        add_food(

            food_name,
            quantity,
            calories,
            protein,
            carbs,
            fat,
            confidence

        )

        return jsonify({

            "success": True,

            "message":
            "Food added to today's meals."

        })

    except Exception:

        return jsonify({

            "success": False,

            "message":
            "Unable to add food."

        }), 400


@app.route("/dashboard")
def dashboard():

    summary = get_today_summary()

    remaining = max(
        DAILY_CALORIE_TARGET
        - summary["consumed"],
        0
    )

    percentage = 0

    if DAILY_CALORIE_TARGET > 0:

        percentage = (
            summary["consumed"]
            / DAILY_CALORIE_TARGET
        ) * 100

    percentage = min(
        round(percentage, 1),
        100
    )

    return jsonify({

        "target":
        DAILY_CALORIE_TARGET,

        "consumed":
        summary["consumed"],

        "remaining":
        round(remaining, 1),

        "percentage":
        percentage,

        "protein":
        summary["protein"],

        "carbs":
        summary["carbs"],

        "fat":
        summary["fat"],

        "foods":
        summary["foods"]

    })


@app.errorhandler(413)
def file_too_large(error):

    return jsonify({

        "success": False,

        "message":
        "Image is too large. Maximum size is 10 MB."

    }), 413


if __name__ == "__main__":

    app.run(
        debug=True
    )