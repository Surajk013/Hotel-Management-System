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
    print("enter render mode ")
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

    print(f"trying to print stuff:{user} {user[0]},{user[2]}")
    print(username,password)
    if user and user[2] == password:
        print("right pwd")
        return jsonify({"message": "Login Successful","user_id":user[0],"user_role":user[3]})
    else:
        print("wrong pwd")
        return jsonify({"message":"Invalid Credentials"}),401




if __name__=="__main__":
    app.run(debug=True)
