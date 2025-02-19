let token= '';
let userRole= '';
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login');
  const bookingForm = document.getElementById('bookingForm');
  const sendButton = document.getElementById('sendButton');
  const createUsrBtn = document.getElementById('createUsrBtn');
  console.log("token created");
  //token  = localStorage.getItem('token');
  userRole = localStorage.getItem('userRole'); 
  if(loginForm) loginForm.addEventListener('submit',handleLogin); 
  if(bookingForm) bookingForm.addEventListener('submit',handleBooking);
  if(sendButton) sendButton.addEventListener('click',handleChatSend);
  if(createUsrBtn) createUsrBtn.addEventListener('click',handleUsrCreation);

  if(!token){
    showSection('loginForm');
  }else{
    console.log("you have the token, showing app content: ");
    showSection("appContent");
    showAppContent(); 
  }
  
});


function handleUsrCreation(){
  console.log("click cpatued");
  console.log("redirection to  createUsr ");
  showSection('createUsr');
  console.log("hoping form is submitted");
  const createuser = document.getElementById('createUsrForm');
  if(createuser)  createuser.addEventListener('submit',createUsr);
  console.log("submitted new user data to backend"); 
}

function createUsr(event){
  console.log("inside createUsr");
  event.preventDefault();
  const formData=new FormData(event.target);
  console.log("Got form");
  const newUsr={
    usrName: formData.get('newUsr'),
    usrLName: formData.get('newLUsr'),
    usrEmail: formData.get('newEmail'),
    usrPNumber: formData.get('newPNumber'),
    usrPword: formData.get('Pword'),
    usrAge: formData.get('age')
  }
  console.log("fetching form data");
  console.log(newUsr);

  fetch('http://127.0.0.1:5000/createUsr', {
    method:'POST',
    headers: {'Content-Type':'application/json'},
    body:JSON.stringify(newUsr)
  })

  .then(response => response.json())
  .then(data => {
      if(data.message === 'dupName'){
        alert('A user already exits with this name...');
      }
    else if(data.message === 'dupEmail'){
        alert('A user already exits with this email...');
      }
      else if(data.message === 'dupNumber'){
        alert('A user already exists with this number . . .');
      }
      else if(data.message === 'created'){
        alert('User created successful ! ');
        showSection('loginForm');
      }
      else if(data.message === 'age'){
        alert('grow up kiddo, \n or ask your paernts ! ')
      }
      else{
        alert('Booking failed: '+data.message);
      }
    })

    .catch(error =>{
      console.error('Error booking room: ',error);
      alert('An error occured. ');
    })

   
}



function showAppContent()
{
  console.log("show rooms section ");
  showSection('rooms');
  console.log("fetching rooms");
  fetchRooms();
  if (userRole === 'staff') {
    console.log("userRole is detected as staff, showing all bookings")
    showSection('bookings');
    fetchBookings();
    
  }
  console.log("rooms fetched");
}
function showSection(sectionId){
  document.querySelectorAll('.content,#loginForm').forEach(section =>{
    section.classList.add('hidden');
  });
  console.log(`Attempting to show section: ${sectionId}`);
  console.log(document.getElementById(sectionId));
  document.getElementById(sectionId).classList.remove('hidden');
}

function handleLogin(event){
  event.preventDefault();
  const username=document.getElementById('username').value;
  const password=document.getElementById('password').value;
  fetch('http://127.0.0.1:5000/login',{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username,password})
  })
  .then(response => response.json())
  .then(data => {
    if(data.user_id){
      alert("Login Successful");
      token=data.user_id;
      userRole=data.user_role;     
      localStorage.setItem('token',data.user_id);
      localStorage.setItem('userRole',data.user_role);
      showSection('appContent');
      showAppContent();
  } else {
    alert('Invalid credentials');
  }
})
  .catch(error => {
    console.error('Error logging in: ',error)
    alert('An error occurred. ')
  });
}

function fetchRooms(){
  fetch('http://127.0.0.1:5000/rooms')
    .then(response => response.json())
    .then(rooms => {
      const roomgrid =document.getElementById('roomGrid');
      roomgrid.innerHTML='';
      rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className='room-card';
        roomCard.innerHTML= `
        <h2>Room ${room.number}</h2>
          <p>Type: ${room.type}</p>
          <p>Price: ₹${room.price}</p>
          <p>Status: ${room.status}</p>
          `;
        roomgrid.appendChild(roomCard);
      });
    })
    .catch(error => console.error('Error fetching rooms:',error));
}

function fetchBookings(){
  const userid=token;
  fetch('http://127.0.0.1:5000/bookings',{
   method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userid,userRole})
  })
    .then(response => response.json())
    .then(bookings => {
      const bookingList = document.getElementById('bookingList');
      bookingList.innerHTML='';
      console.log("trying . . . ",bookings);
      bookings.forEach(booking => {
        const bookingCard = document.createElement('div');
       bookingCard.className = 'booking-card';
        bookingCard.innerHTML = `
        <h3>Booking for ${booking.guest_name}</h3>
        <h4>User ID: ${booking.userid}</h4>
        <h4>Booking ID: ${booking.id}</h4>
        <p>Room Type: ${booking.room_type}</p>
        <p>Room Number: ${booking.room_number}</p>
        <p>Check-in: ${booking.check_in}</p>
        <p>Check-out: ${booking.check_out}</p>
        <p>Price : ₹${booking.price}</p>
        <button onclick="cancelBooking(${booking.id})">Cancel booking</button>
        <button onclick="pay(${booking.id})">Pay</button>
        `;
        bookingList.appendChild(bookingCard)
      });
    })
    .catch(error => console.error('error fetching bookings:',error));
}

function pay(bookingid){
  fetch('http://127.0.0.1:5000/pay',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({bookingid:bookingid})
  })
  .then(response => response.json())
  .then(data=>{
    console.log(data.message);
    alert(data.message);
  })
  .catch(error => {
    console.error("Error:",error);
    alert("Payment failed. Please try again. ")
  })
}

function handleBooking(event){
  event.preventDefault();
  const userid=token;
  const formData=  new FormData(event.target);
  console.log("fetching the userrrrrrrrrrrrrrrrrr data to form");
  const booking = {
    guestName: formData.get('guestName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    roomType: formData.get('roomType'),
    checkIn: formData.get('checkIn'),
    checkOut:formData.get('checkOut'),
    token : userid
  };
  console.log(booking);

  fetch('http://127.0.0.1:5000/book', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(booking)
  })

    //console.log("data sent to backend")
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Booking successful'){
        alert('Booking successful!');
        fetchBookings();
        event.target.reset();
        showSection('bookings');
      }else if(data.message ===  'verybad!'){
        alert('the check in is after the checkout')
      }

      else{
        alert('Booking failed: '+data.message);
      }
    })
    .catch(error => {
      console.error('Error booking room: ',error);
      alert('An error occured.');
    });
}

function cancelBooking(bookingId){
  if (!confirm("Are ou sure you want to cancel this booking?")){
    return;
  }

  fetch('http://127.0.0.1:5000/cancel_booking',{
    method:'POST',
    headers: {'Content-Type':'application/json'},
    body:JSON.stringify({bookingId: bookingId})
  })

    .then(response => response.json())
    .then(data => {
      if (data.message === 'Booking cancelled successfully'){
        alert('Booking cancelled successfully! ');
        fetchBookings();
      }else{
        alert('Failed to cancel booking: '+data.message);
      }
    })
    .catch(error => {
      console.error('Error cancelling booking:',error);
      alert('An error occurred while cancelling the booking. ');
    });
}

function handleChatSend(){
  console.log(token)
  const messageInput=document.getElementById('chatInput');
  const message=messageInput.value.trim();
  if(!message) return;
  appendMessage('You: ',message,true);
  messageInput.value='';
  fetch('http://127.0.0.1:5000/chat',{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message:message,token:token})
  })
    .then(response => response.json())
    .then(data => {
      appendMessage('Bot:',data.message,false);
      if (data.action === 'prompt_booking') {
        showSection('newBookings');
        fetchRooms();
      } else if(data.action === 'show_rooms'){
        showSection('rooms');
        fetchRooms();
      }
      else if(data.action === 'show_bookings'){
        showSection('bookings');
        fetchBookings();
      }
      else if(data.nav === 'bookings'){
        showSection('bookings');
        fetchBookings();
      }
    })
    .catch(error => {
      console.error('Error during chat:',error);
      appendMessage('Bot:','Error processing your request',false);
    });
  }

function appendMessage(sender,message,isUserMessage){
  const chatLog=document.getElementById('chatLog');
  const messageDiv=document.createElement('div');
  messageDiv.textContent = `${sender} : ${message}`;
  if(isUserMessage){
    messageDiv.style.textAlign="right"
  }
  chatLog.appendChild(messageDiv);
  chatLog.scrollTop=chatLog.scrollHeight;
}

function setChatInput(text){
  document.getElementById('chatInput').value = text;
}
