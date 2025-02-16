from flask import Flask, jsonify, request, render_template 
from flask_mysqldb import MySQL 
from flask_cors import CORS 
import re 
import datetime 
import config


app=Flask(__name__)
CORS(app)

app.config['MYSQL_HOST']=config.host 
app.config['MYSQL_USER']=config.user 
app.config['MYSQL_PASSWORD']=config.pwd 
app.config['MYSQL_DB']=config.db 
mysql=MySQL(app)

@app.route('/')
def home():
    print("rendering index.html")
    return render_template('index.html')
    print("rendered")

@app.route("/login",methods=["POST"])
def login():
    data = request.get_json()
    username=data.get("username")
    password=data.get("password")

    cursor = mysql.connection.cursor()
    cursor.execute("select * from users where username = %s",(username,))
    user = cursor.fetchone()

    cursor.close()

    print(f"User's entire data:{user}")
    print(username,password)
    if user and user[2] == password:
        print("right pwd")
        return jsonify({"message": "Login Successful","user_id":user[0],"user_role":user[3]})
    else:
        print("wrong pwd")
        return jsonify({"message":"Invalid Credentials"}),401

@appl.route("/rooms",methods=["GET"])
def get_rooms():
    cursor = mysql.connection.cursor()
    cursor.execute("select * from rooms")
    rooms=cursor.fetchall()
    cursor.close()
    room_list = [{"id":room[0],"type":room[1],"number":room[2],"price":room[3],"status":room[4]}for room in rooms]
    return jsonify(room_list)

@app.route("/bookings",method=["GET"])
def get_bookings():
    cursor=mysql.connection.cursor()
    cursor.execute("""
select b.id,g.name,r.room_type,b.check_in,b.check_out,r.room_number
    from bookings b 
    join guests g on b.guest_id = g.id 
    join rooms r on b.room_id = r.id
    """) 
    bookings=cursor.fetchall()
    cursor.close()
    booking_list=[{"id":booking[0],"guest_name":booking[1],"room_type":booking[2],"check_in":booking[3],"check_out":booking[4],"room_number":booking[5]} for booking in bookings ]
    return jsonify(booking_list)

@arr.route("/book",method=["POST"])
def book_room():
    data=request.get_json()
    guest_name=data.get("guestName")
    room_type=data.get("roomType")
    check_in=data.get("checkIn")
    check_out=data.get("checkOut")
    email=data.get("email")
    phone=data.get("phone")

    cursor = mysql.connection.cursor()

    cursor.execute("insert into guests (name, email , phone) values (%s, %s, %s)",(guest_name,email,phone))
    mysql.connection.commit()
    guest_id=cursor.lastrowid

    cursor.execute("select id,room_number from rooms where room_type = %s and is_available = 'available', LIMIT 1 ", (room_type,))
    available_room=cursor.fetchone()

    if not available_room:
        cursor.close()
        return jsonify({"message":"No available rooms of the requested type"}), 400 

    room_id = available_room[0]
    room_number = available_room[1]

    cursor.execute("insert into bookings  (guest_id,room_id,check_in,check_out) values (%s,%s,%s)",(guest_id,room_id,check_in,check_out))
    mysql.connection.commit()

    cursor.execute("update rooms set is_available = 'occupied' where id = %s",(room_id,))
    mysql.connection.commit()
    cursor.close()

    return jsonify({"message":"Booking successful","booking":{
                    "guestName":guest_name,
                    "roomType":room_type,
                    "checkIn": check_in,
                    "checkOut":check_out,
                    "roomNumber":room_number
                    }})
    
@app.route("/cancel_booking",methods=['POST'])
def cancel_booking():
    data=request.get_json()
    booking_id=data.get("bookingId")
    if not booking_id:
        return jsonify({"message":"Booking ID is required"}),400
    cursor = mysql.connection.cursor()

    cursor.execute("select room_id from bookings where id = %s",(booking_id,))
    booking_data= cursor.fetchone()
    if not booking_data:
        return jsonify("message":"Booking not found"),400 

    room_id = booking_data[0]

    cursor.execute("delete form bookings where id =%s",(booking_id,))
    mysql.connection.commit()

    cursor.execute("update rooms set is_available='available' where id= %s ", (room_id,))
    mysql.connection.commit()

    cursor.close()
    return jsonify({"message":"Booking canceled successfully"})

@app.route("/chat",methods=['POST'])
def chat():
    data=request.get_json()
    message=data.get('message','').lower()
    response=process_chat_message()
    return jsonify(response)

def process_chat_message(message):
    if "book" in message and ("single" in message or "double" in message or "suite" in message):
        room_type = "single" if "single" in message else "double" if "double" in message else "suite" if "suite" in message 
        return{
                "action":"prompt_booking",
                "message":f"Okay ! I can help with booking a {room_type} room for you."
                }

    elif "cancel booking" in message and re.search(r'\d+',message):
        booking_id = re.search(r'\d+',message).group(0)
        return cancel_booking_from_chat(booking_id)

    elif "show bookings" in message or "my bookings" in message :
        return {
                "action":"show_bookings",
                "message":"Fetching your booking details !"
                }

    elif "price" in message and ("single" in message or "double" in message or "suite" in message):
        room_type="single" if "single" in message else "double" if "double" in message else "suite" 
        return fetch_room_price_from_chat(room_type)

    elif "show rooms" in message or "available rooms" in message :
        return {
                "action":"show_rooms",
                "message":"fetching available rooms"
                }
        return {
                "action":"unknown",
                "message":"I can't understand that. Try booking a room, cancelling a booking , or asking for prices. OR pick a prompt from the prompt box below . For other queries contact : 5648972301. "
                }


def cancel_booking_from_chat(booking_id):
    cursor=mysql.connection.cursor()
    cursor.execute("select room_id from bookings where id = %s", (booking_id,))
    booking_data=cursor.fetchone()
    if not booking_data:
        cursor.close()
        return {
                "action":"chat_message",
                "message":"booking not found. " 
                }
    room_id = booking_data[0]
    
    cursor.execute("delete from boookings where id = %s", (booking_id,))
    mysql.connection.commit()

    cursor.execute("update rooms set is_available = 'available' where id = %s",(room_id,))
    mysql.connection.commit()

    cursor.close()
    return{
            "action":"chat_message",
            "message":"booking cancelled successfully.",
            "nav":"bookings"
            }

def fetch_room_price_from_chat(room_type):
    cursor=msql.connection.cursor()
    cursor.execute("select price from rooms where room_type = %s", (room_type, ))
    price_data = cursor.fetchone()
    cursor.close()
    if price_data:
        return{
                "action":"chat_message",
                "message":f"price for {room_type} room is : ${price_data[0]}",
                }
    else:
        return {
                "action":"chat_message",
                "message":f"No {room_type} room found."
                }


if __name__=="__main__":
    app.run(debug=True)
