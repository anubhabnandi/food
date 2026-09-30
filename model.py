from transformers import pipeline

print("Loading AI food recognition model...")

food_classifier = pipeline(
    "image-classification",
    model="nateraw/food"
)

print("AI model loaded successfully.")


def predict_food(image_path):

    results = food_classifier(image_path)

    if not results:
        raise ValueError("The AI model could not recognize the food.")

    top_result = results[0]

    food_name = top_result["label"]
    confidence = round(
        float(top_result["score"]) * 100,
        2
    )

    return food_name, confidence