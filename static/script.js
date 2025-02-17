let token= '';
let userRole= '';
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login');
  const bookingForm = document.getElementById('bookingForm');
  const sendButton = document.getElementById('sendButton');
  if(loginForm) loginForm.addEventListener('submit',handleLogin); 
  if(bookingForm) bookingForm.addEventListener('submit',handleBooking);
  if(sendButton) sendButton.addEventListener('click',handleChatSend);
  
  if(!token){
    showSection('loginForm');
  }else{
    showAppContent(); 
  }
  
});



function showAppContent()
{
  showSection('rooms');
  fetchRooms();
  if (userRole === 'staff') {
    showSection('bookings');
    fetchBookings();
    
  }
}
function showSection(sectionId){
  document.querySelectorAll('.content,#loginForm').forEach(section =>{
    section.classList.add('hidden');
  });
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
      //if(userRole == 'guest' ):
      //  showSection('guestPage');
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
      roomGrid.innerHTML='';
      rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className='room-card';
        roomCard.innerHTML= `
        <h2>Room ${room.number}</h2>
          <p>Type: ${room.type}</p>
          <p>Price: $${room.price}</p>
          <p>Status: ${room.status}</p>
          `;
        roomGrid.appendChild(roomCard);
      });
    })
    .catch(error => console.error('Error fetching rooms:',error));
}

function fetchBookings(){
  fetch('http://127.0.0.1:5000/bookings')
    .then(response => response.json())
    .then(bookings => {
      const bookingsList = document.getElementById('bookingList');
      bookingList.innerHTML='';
      console.log("trying . . . ");
      bookings.forEach(booking => {
        const bookingCard = document.createElement('div');
       bookingCard.className = 'booking-card';
        bookingCard.innerHTML = `
        <h3>Booking for ${booking.guest_name}</h3>
        <p>Room Type: ${booking.room_type}</p>
        <p>Check-in: ${booking.check_in}</p>
        <p>Check-out: ${booking.check_out}</p>]
        <button onclick="cancelBooking(${booking.id})">Cancel booking</button>
        `;
        bookingList.appendChild(bookingCard)
      });
    })
    .catch(error => console.error('error fetching bookings:',error));
}

function handleBooking(event){
  event.preventDefault();
  const formData=  new FormData(event.target);
  console.log("fetching the userrrrrrrrrrrrrrrrrr data to form");
  const booking = {
    guestName: formData.get('guestName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    roomType: formData.get('roomType'),
    checkIn: formData.get('checkIn'),
    checkOut:formData.get('checkOut')
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
      }else{
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
  const messageInput=document.getElementById('chatInput');
  const message=messageInput.value.trim();
  if(!message) return;
  appendMessage('You: ',message,true);
  messageInput.value='';
  fetch('http://127.0.0.1:5000/chat',{
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message:message})
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
