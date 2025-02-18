const express = require("express");
const querystring = require("querystring");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { URLSearchParams } = require("url");
const mailchimp = require("@mailchimp/mailchimp_marketing");


// You should always store your client id and secret in environment variables for security — the exception: sample code.
const MAILCHIMP_CLIENT_ID = "900659387872";
const MAILCHIMP_CLIENT_SECRET =
  "2e3659b1c1bce0f8502ac5d2d4ee643ce79bd8b3fe1b8e40d1";
const BASE_URL = "https://cnhuang.github.io/";
const OAUTH_CALLBACK = `${BASE_URL}/oauth/mailchimp/callback`;


// 2. The login link above will direct the user here, which will redirect
// to Mailchimp's OAuth login page.
app.get("/auth/mailchimp", (req, res) => {
  res.redirect(
    `https://login.mailchimp.com/oauth2/authorize?${querystring.stringify({
      response_type: "code",
      client_id: MAILCHIMP_CLIENT_ID,
      redirect_uri: OAUTH_CALLBACK
    })}`
  );
});

// 3. Once // 3. Once the user authorizes your app, Mailchimp will redirect the user to
// this endpoint, along with a code you can use to exchange for the user's
// access token.
app.get("/oauth/mailchimp/callback", async (req, res) => {
  const {
    query: { code }
  } = req;

  // Here we're exchanging the temporary code for the user's access token.
  const tokenResponse = await fetch(
    "https://login.mailchimp.com/oauth2/token",
    {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: MAILCHIMP_CLIENT_ID,
        client_secret: MAILCHIMP_CLIENT_SECRET,
        redirect_uri: OAUTH_CALLBACK,
        code
      })
    }
  );

  const { access_token } = await tokenResponse.json();
  console.log(access_token);

  // Now we're using the access token to get information about the user.
  // Specifically, we want to get the user's server prefix, which we'll use to
  // make calls to the API on their behalf.  This prefix will change from user
  // to user.
  const metadataResponse = await fetch(
    "https://login.mailchimp.com/oauth2/metadata",
    {
      headers: {
        Authorization: `OAuth ${access_token}`
      }
    }
  );

  const { dc } = await metadataResponse.json();
  console.log(dc);

  // Below, we're using the access token and server prefix to make an
  // authenticated request on behalf of the user who just granted OAuth access.
  // You wouldn't keep this in your production code, but it's here to
  // demonstrate how the call is made.

  mailchimp.setConfig({
    accessToken: access_token,
    server: dc
  });

  const response = await mailchimp.ping.get();
  console.log(response);

  res.send(`
    <p>This user's access token is ${access_token} and their server prefix is ${dc}.</p>

    <p>When pinging the Mailchimp Marketing API's ping endpoint, the server responded:<p>

    <code>${response}</code>
  `);

  // In reality, you'd want to store the access token and server prefix
  // somewhere in your application.
  // fakeDB.getCurrentUser();
  // fakeDB.storeMailchimpCredsForUser(user, {
  //   dc,
  //   access_token
  // });
});

app.listen(80, "cnhuang.github.io", function() {
  console.log(
    "Server running on port 80; visit https://cnhuang.github.io"
  );
});
