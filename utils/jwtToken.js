const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();

  // Determine the token name based on the user's role
  let tokenName;
  if (user.role === "staff") {
    tokenName = "s_token";
  } else if (user.role === "user") {
    tokenName = "u_token";
  } else {
    tokenName = "token"; // Default token name if role is not 'staff' or 'user'
  }

  // Options for cookies
  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  // Set the token name dynamically when setting the cookie
  res.status(statusCode).cookie(tokenName, token, options).json({
    success: true,
    user,
    token,
  });
};

export default sendToken;
