// app/utils/authRedirect.js

// Centralized auth-based redirect rules
// (initial scaffold – wiring comes later)

export function getRedirectPath({ user, profileComplete }) {
  if (!user) {
    return "/login";
  }

  if (user && !profileComplete) {
    return "/create-profile";
  }

  if (user && profileComplete) {
    return "/letterhome";
  }

  return null;
}
