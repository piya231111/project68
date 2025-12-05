// เก็บสถานะผู้รอจับคู่
let waitingUsers = [];  

// เก็บห้องสุ่มที่กำลัง active
let randomRooms = {};   

function getSimilarity(arr1, arr2) {
  return arr1.filter(x => arr2.includes(x)).length;
}

function findMatch(user) {
  return waitingUsers.find(u =>
    u.userId !== user.userId &&
    u.country === user.country &&
    getSimilarity(u.interests, user.interests) >= 3 &&
    !u.friends.includes(user.userId) &&    
    u.isOnline === true
  );
}

function removeFromQueue(userId) {
  waitingUsers = waitingUsers.filter(u => u.userId !== userId);
}

module.exports = {
  waitingUsers,
  randomRooms,
  findMatch,
  removeFromQueue
};
