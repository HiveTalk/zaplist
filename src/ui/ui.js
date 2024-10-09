// Functions for UI updates
export function updateUIAfterConnection(info) {
  loginBtn.style.display = 'block';
  logoutBtn.style.display = 'block';
  userProfile.style.display = 'block';
  userName.textContent = info.alias || 'Anonymous';
  userAvatar.src = info.avatar || 'https://via.placeholder.com/100';
  userBanner.src = info.banner || 'https://via.placeholder.com/500x200';
}

export function updateUIAfterDisconnection() {
  loginBtn.style.display = 'block';
  logoutBtn.style.display = 'none';
  userProfile.style.display = 'none';
}
