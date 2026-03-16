/**
 * Activity Logger for Google Apps Script
 * Logs user login/signup activities to Google Sheets
 */

const logUserActivity = async (email: string, actionType: 'login' | 'signup') => {
  // Use new deployment URL you just generated
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz2KDeP6GtPJ9NRCikBbf2VXNK4az92eSS2WHjt2b5zgu6gPH0kvzdJXJ6z76t8b8EDvw/exec";

  try {
    // We remove 'await' here so user's login/signup isn't delayed 
    // by the background logging process.
    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-cache",
      body: JSON.stringify({
        email: email,
        action: actionType,
      }),
    });
  } catch (error) {
    // This will only catch network-level errors, not script errors
    console.error("Failed to log activity:", error);
  }
};

export { logUserActivity };
