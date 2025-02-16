let token= '';
let userRole= '';
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login');
  if(loginForm) loginForm.addEventListener('submit',handleLogin); 
  
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
  if (userRole==='staff') {
    showSection('bookings');
    fetchBookings();
    
  }
}
function showSection(sectionId){
  document.querySelectorAll('content','#loginForm').forEach(section =>{
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
    if(data.message === 'Login successful'){
      token=data.user_id;
    userRole=data.user_role;
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
