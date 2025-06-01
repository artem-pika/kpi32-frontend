// User credentials

export function checkUsernameValidity(username) {
  return /^[a-zA-Z\d_\-]{3,50}$/.test(username);
}

export function checkPasswordValidity(password) {
  return /^[A-Za-z\d\-_@$!%*#?&]{4,}$/.test(password);
}

// Transaction inputs

export function checkDateValidity(date) {
  return /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/.test(date);
}

export function checkAmountValidity(amount) {
  return /^[\-\+]\d+(\.\d+)?$/.test(amount);
}

export function checkTagsValidity(tags) {
  return /^\s*(#[a-zA-Z\d_\-]+\s+)*(#[a-zA-Z\d_\-]+)?$/.test(tags);
}

export function checkTransactionValidity({ date, amount, tags }) {
  return checkDateValidity(date) &&
    checkAmountValidity(amount) &&
    checkTagsValidity(tags);
}