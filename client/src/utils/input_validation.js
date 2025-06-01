// User credentials

export function checkUsernameValidity(username) {
  if (username.length < 3) return 'Should be at least 3 characters long.';

  return /^[a-zA-Z\d_\-]{3,50}$/.test(username) ? 
    'ok' : 
    'Invalid username format.';
}

export function checkPasswordValidity(password) {
  if (password.length < 4) return 'Should be at least 4 characters long.';

  return /^[A-Za-z\d\-_@$!%*#?&]{4,}$/.test(password) ? 
    'ok' : 
    'Invalid password format.';
}

// Transaction inputs

export function checkDateValidity(date) {
  if (date.length === 0) return 'Should not be empty.';

  return /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/.test(date) ? 
    'ok' : 
    'Should be in DD-MM-YYYY format.';
}

export function checkAmountValidity(amount) {
  if (amount.length === 0) return 'Should not be empty.';

  return /^[\-\+]\d+(\.\d+)?$/.test(amount) ? 
    'ok' : 
    'Should be like -100.5 or +100';
}

export function checkTagsValidity(tags) {
  return /^\s*(#[a-zA-Z\d_\-]+\s+)*(#[a-zA-Z\d_\-]+)?$/.test(tags) ? 
    'ok' : 
    'Should be like "#tag1 #tag2"';
}