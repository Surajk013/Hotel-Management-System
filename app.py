from flask import Flask, jsonify, request, render_template
from flask_mysqldb import MySQL
from flask_cors import CORS
import re
import datetime
import config

app = Flask(__name__)
CORS(app)
import requests

# Google Gemini API Endpoint
GEMINI_API_URL=config.GEMINI_API_URL
API_KEY=config.API_KEY
# Your Gemini API Key (Replace this with your actual key)
print(GEMINI_API_URL)
print(API_KEY)



def get_cheapest_hotel(location):
    """
    Fetches the cheapest hotel booking price using Gemini API.
    """
    prompt = f"Find the cheapest hotel booking price in {location} with details."

    # API Request Payload
    payload = {
        "prompt": {"text": prompt},
        "temperature": 0.7
    }

    # Making the API request
    response = requests.post(
        f"{GEMINI_API_URL}?key={API_KEY}",
        json=payload
    )

    if response.status_code == 200:
        data = response.json()
        return parse_hotel_data(data)
    else:
        print("Error:", response.json())
        return None

def parse_hotel_data(data):
    """
    Parses the response from Gemini API and extracts hotel details.
    """
    try:
        response_text = data["candidates"][0]["output"]["text"]
        hotels = response_text.split("\n") 
        
        
        min_price = float("inf")
        cheapest_hotel = None

        for hotel in hotels:
            parts = hotel.split(",")  
            if len(parts) >= 3:
                try:
                    price = float(parts[2].replace("$", "").strip())
                    if price < min_price:
                        min_price = price
                        cheapest_hotel = hotel
                except ValueError:
                    continue
        
        return cheapest_hotel if cheapest_hotel else "No hotel data found."
    
    except KeyError:
        return "Invalid API response format."

if __name__ == "__main__":
    location = input("Enter the location: ")
    cheapest_hotel = get_cheapest_hotel(location)

    if cheapest_hotel:
        print("\nCheapest Hotel Found:")
        print(cheapest_hotel)
    else:
        print("No hotels found.")

# Database Configuration
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'suraj'
app.config['MYSQL_PASSWORD'] = 'test'
app.config['MYSQL_DB'] = 'hotel_management'
mysql = MySQL(app)


@app.route('/')
def home():
    return render_template('hotel-management.html')

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, username, password, role, name FROM users WHERE username = %s ", (username,))
    user = cursor.fetchone()
    cursor.close()

    if user and user[2] == password:
        return jsonify({"message": "Login successful", "user_id": user[0], "user_role": user[3], "user_name": user[4]})
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route("/rooms", methods=["GET"])
def get_rooms():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM rooms")
    rooms = cursor.fetchall()
    cursor.close()
    room_list = [{"id": room[0], "type": room[1], "number": room[2], "price": room[3], "status": room[4]} for room in rooms]
    return jsonify(room_list)

@app.route("/bookings", methods=["GET"])
def get_bookings():
    user_id = request.headers.get('user_id')
    if not user_id:
         return jsonify({"message": "User id is required"}), 400

    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT b.id, g.name, r.room_type, b.check_in, b.check_out, r.room_number
        FROM bookings b
        JOIN guests g ON b.guest_id = g.id
        JOIN rooms r ON b.room_id = r.id
        JOIN users u ON g.id = u.id
        WHERE u.id = %s
    """, (user_id,))
    bookings = cursor.fetchall()
    cursor.close()
    booking_list = [{"id": booking[0], "guest_name": booking[1], "room_type": booking[2], "check_in": booking[3], "check_out": booking[4], "room_number": booking[5]} for booking in bookings]
    return jsonify(booking_list)

@app.route("/book", methods=["POST"])
def book_room():
    data = request.get_json()
    guest_name = data.get("guestName")
    room_type = data.get("roomType")
    check_in = data.get("checkIn")
    check_out = data.get("checkOut")
    email = data.get("email")
    phone = data.get("phone")

    cursor = mysql.connection.cursor()

    # Insert guest information if not exist
    cursor.execute("INSERT INTO guests (name, email, phone) VALUES (%s, %s, %s)", (guest_name, email, phone))
    mysql.connection.commit()
    guest_id = cursor.lastrowid


    cursor.execute("SELECT id, room_number FROM rooms WHERE room_type = %s AND is_available = 'available' LIMIT 1", (room_type,))
    available_room = cursor.fetchone()

    if not available_room:
        cursor.close()
        return jsonify({"message": "No available rooms of the requested type"}), 400

    room_id = available_room[0]
    room_number = available_room[1]

    cursor.execute("INSERT INTO bookings (guest_id, room_id, check_in, check_out) VALUES (%s, %s, %s, %s)",
                   (guest_id, room_id, check_in, check_out))
    mysql.connection.commit()

    cursor.execute("UPDATE rooms SET is_available = 'occupied' WHERE id = %s", (room_id,))
    mysql.connection.commit()
    cursor.close()

    return jsonify({"message": "Booking successful", "booking": {
        "guestName": guest_name,
        "roomType": room_type,
        "checkIn": check_in,
        "checkOut": check_out,
        "roomNumber": room_number
    }})


@app.route("/cancel_booking", methods=["POST"])
def cancel_booking():
    data = request.get_json()
    booking_id = data.get("bookingId")
    if not booking_id:
        return jsonify({"message": "Booking ID is required"}), 400
    cursor = mysql.connection.cursor()

    cursor.execute("SELECT room_id FROM bookings WHERE id = %s", (booking_id,))
    booking_data = cursor.fetchone()
    if not booking_data:
        cursor.close()
        return jsonify({"message": "Booking not found"}), 404

    room_id = booking_data[0]

    cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
    mysql.connection.commit()

    cursor.execute("UPDATE rooms SET is_available = 'available' WHERE id = %s", (room_id,))
    mysql.connection.commit()

    cursor.close()
    return jsonify({"message": "Booking cancelled successfully"})


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').lower()
    response = process_chat_message(message)
    return jsonify(response)


def process_chat_message(message):
    if "book" in message and ("single" in message or "double" in message or "suite" in message):
        room_type = "single" if "single" in message else "double" if "double" in message else "suite"
        return {
            "action": "prompt_booking",
            "message": f"Okay, I can help with booking a {room_type} room for you."
        }
    elif "cancel booking" in message and re.search(r'\d+', message):
        booking_id = re.search(r'\d+', message).group(0)
        return cancel_booking_from_chat(booking_id)
    elif "show bookings" in message or "my bookings" in message:
        return {
            "action": "show_bookings",
            "message": "Fetching your booking details"
        }

    elif "price" in message and ("single" in message or "double" in message or "suite" in message):
        room_type = "single" if "single" in message else "double" if "double" in message else "suite"
        return fetch_room_price_from_chat(room_type)

    elif "show rooms" in message or "available rooms" in message:
          return {
            "action": "show_rooms",
            "message": "Fetching available rooms"
        }
    return {"action": "unknown", "message": "I can't understand that. Try booking a room, canceling a booking, or asking for prices."}


def cancel_booking_from_chat(booking_id):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT room_id FROM bookings WHERE id = %s", (booking_id,))
    booking_data = cursor.fetchone()
    if not booking_data:
        cursor.close()
        return {"action": "chat_message", "message": "Booking not found."}
    room_id = booking_data[0]

    cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
    mysql.connection.commit()

    cursor.execute("UPDATE rooms SET is_available = 'available' WHERE id = %s", (room_id,))
    mysql.connection.commit()

    cursor.close()
    return {"action": "chat_message", "message": "Booking cancelled successfully.", "nav": "bookings"}


def fetch_room_price_from_chat(room_type):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT price FROM rooms WHERE room_type = %s", (room_type,))
    price_data = cursor.fetchone()
    cursor.close()
    if price_data:
        return {"action": "chat_message", "message": f"Price for {room_type} room is: ${price_data[0]}", }
    else:
        return {"action": "chat_message", "message": f"No {room_type} rooms found."}


if __name__ == "__main__":
    app.run(debug=True)
