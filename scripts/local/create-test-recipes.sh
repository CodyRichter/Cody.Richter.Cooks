#!/bin/bash

# Configuration
BASE_URL="http://localhost:8000/api/v1"
USERNAME="PostmanUser1"
PASSWORD="TestPassword123!"

echo "Logging in as $USERNAME..."

# Login and get access token
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/users/login" \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "Login failed. Response:"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "Successfully logged in. Token obtained."

# Array of 20 recipes
recipes=(
  "Pasta Carbonara" "Chicken Alfredo" "Beef Bourguignon" "Vegetable Lasagna"
  "Seafood Paella" "Mushroom Stroganoff" "Chicken Tikka Masala" "Eggplant Moussaka"
  "Beef Wellington" "Pumpkin Soup" "Classic Caesar Salad" "Greek Salad"
  "Fish and Chips" "Margherita Pizza" "Tacos al Pastor" "Pad Thai"
  "Ratatouille" "Sushi Rolls" "Beef Chili" "French Onion Soup"
)

echo "Creating 20 recipes..."

for i in "${!recipes[@]}"; do
    name="${recipes[$i]}"
    echo "[$((i+1))/20] Creating: $name"

    JSON_PAYLOAD=$(cat <<EOF
{
  "title": "$name",
  "description": "<h3>Description</h3><p>A classic preparation of $name, perfect for any night of the week. This recipe has been passed down through generations and represents the finest in home cooking.</p><p>Enjoy the rich textures and balanced flavors that make this dish a favorite.</p>",
  "tags": ["test", "seed", "delicious"],
  "cooking_time": $((20 + i * 5)),
  "serving_size": 4,
  "ingredients": [
    {"name": "Primary Protein", "quantity": 500, "unit": "g", "order_index": 0},
    {"name": "Olive Oil", "quantity": 2, "unit": "tbsp", "order_index": 1},
    {"name": "Salt", "quantity": 1, "unit": "tsp", "order_index": 2},
    {"name": "Black Pepper", "quantity": 1, "unit": "tsp", "order_index": 3},
    {"name": "Fresh Herbs", "quantity": 1, "unit": "bunch", "order_index": 4}
  ],
  "instructions": [
    {"title": "Preparation", "description": "<p>Wash and chop all fresh ingredients. Measure out spices and ensure everything is ready for cooking.</p>", "step_number": 1},
    {"title": "Initial Cook", "description": "<p>Heat olive oil in a large pan. Sear the primary protein until browned on all sides.</p>", "step_number": 2},
    {"title": "Simmer", "description": "<p>Add additional seasonings and any liquids. Reduce heat and simmer for the recommended time.</p>", "step_number": 3},
    {"title": "Final Touch", "description": "<p>Check for seasoning, add fresh herbs, and serve immediately while hot.</p>", "step_number": 4}
  ]
}
EOF
)

    curl -s -X POST "$BASE_URL/recipes/" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$JSON_PAYLOAD" > /dev/null

done

echo "Done! 20 recipes created."
TOTAL=$(curl -s "$BASE_URL/recipes/" | jq -r '.total')
echo "Total recipes now in system: $TOTAL"
