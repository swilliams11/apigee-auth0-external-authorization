# Apigee Edge/Auth0 and External Authorization - Store Authorization Code and Access Token
## Summary
This repo demonstrates the following:
1. How to save an external authorization code generated by Auth0 in Apigee Edge
2. How to save an external access token (opaque or JWT) from Auth0 in Apigee Edge

Why is this important?  Our clients are integrating with OpenID connect providers like Okta, Oracle IDCS, Ping, Auth0, etc. and they want to know and understand how to integrate Apigee Edge with these providers. This repo demonstrates how to accomplish that with Auth0.  You can follow this pattern for the other providers as well.

## TOC
* [Auth0 Store an External Authorization Code](#apigee-auth0-external-authorization)
* [Auth0 Store an External Access Token](#auth0-store-an-external-access-token)

## Prerequisites
You may need to [install acurl](http://docs.apigee.com/api-services/content/using-oauth2-security-apigee-edge-management-api#howtogetoauth2tokens).


You must export the following environment variables:
```
export ae_password=apigeepassword
export ae_username=apigeeusername
export ae_org=apigeeorg
```

### Auth0
You should create an account in [Auth0](https://auth0.com/) and create a [Auth0 client](https://auth0.com/docs/clients) to obtain a client ID and secret.
A good starting point is to read this [community article](https://community.apigee.com/articles/42269/auth0-with-apigee.html). It provides instructions to setup a new Auth0 client to obtain a client ID and secret.

* The redirect URI that you should enter into your Auth0 client is `https://org-env.apigee.net/oauth_auth0/redirect`.
* Create a user in Auth0. This is the user that you will use to login during the redirect step.

### Update edge.json
You should update the following entries in the `auth0-oauth/edge.json` and `auth-oauth-store-jwt/edge.json` files. Just use a find and replace to update all the values shown below.  
* `yourdomain.auth0.com`
* `https://yourdomain.auth0.com`
* `https://org-env.apigee.net/`

## Helpful to Know
You don't have to review these links, since I list all the commands to deploy the proxy.  But if you are interested in learning more about the config and deploy plugins, then you should read them.  
* [apigee-config-maven-plugin](https://github.com/apigee/apigee-config-maven-plugin)
* [apigee-maven-deploy-plugin](https://github.com/apigee/apigee-deploy-maven-plugin)


# Auth0 Store an External Authorization Code

## apigee-auth0-external-authorization
This proxy demonstrates how to enable external authorization with Auth0.  It saves the authorization code generated by Auth0 in Edge so that the proxy can subsequently validate that authorization code on the /token request.

The `auth0-oauth` proxy does not save the JWT as an external access token.  Once the client has the JWT, then they should include that as an `Authorization: Bearer` header on subsequent requests.  All of your other proxies should validate the JWT, with the public certificate, expiry and custom claims.  Make sure to include the [JWT/JWE/JWS Java Callout](https://github.com/apigee/iloveapis2015-jwt-jwe-jws) written by Dino, which validates JWTs.  

There is only one issue with this approach, Edge will not have the developer details, so you won't know who called your API proxy.  I will list two approaches to solve this problem:
1. Store the JWT as an External access token
  * I would recommend validating the JWT before you store it as an external access token.
2. Validate and decode the JWT, extract the client_id, use the Verify API Key to validate it

Both options accomplish the same goal, to ensure that Apigee Edge has the developer info to populate analytics.  

### High-level Flow
* `/authorize` - validates the client ID redirect uri and forwards the request to Auth0 to generate the authorization code.
* `/redirect` - called by Auth0 and extracts the Auth0 authorization code and saves it in Apigee Edge.
* `/token` - validates the client ID and redirect URI and forward the request to Auth0 to generate the JWT.


## Deploy
Follow the steps below to deploy shared flows and the proxy, and create the developer, product and app in Apigee Edge.

### Deploy a Shared Flows
The shared flows must be deployed first.

```
cd auth0-ProxyDefaultFaultRule
mvn install -PtestSharedFlow -Dusername=$ae_username -Dpassword=$ae_password -Dorg=$ae_org -Dauthtype=oauth
cd ../auth0-ProxyFaultRules
mvn install -PtestSharedFlow -Dusername=$ae_username -Dpassword=$ae_password -Dorg=$ae_org -Dauthtype=oauth
```

### Proxy
This will deploy the `auth0-auth` proxy and create the Apigee developer named `john@example.com`, a product named `auth0-product` and an app named `auth0-app`.  

If you are running this for the first time then you must deploy the proxy first, before you run the config step.  Then run the config step below.
```
cd ../auth0-auth
mvn install -Ptest -Dusername=$ae_username -Dpassword=$ae_password \
                    -Dorg=$ae_org -Dauthtype=oauth
```

If the proxy is deployed, then you can run this step.  It will redeploy the proxy and create the necessary configuration.  
```
mvn install -Ptest -Dusername=$ae_username -Dpassword=$ae_password \
                    -Dorg=$ae_org -Dauthtype=oauth -Dapigee.config.options=create
```

## Create the client ID and secret in Edge
Once you create the client in Auth0 and create the Apigee product and app, then you have to add the client ID and secret into Apigee Edge. Use the following API calls to add the credentials to Apigee Edge.

[Create a consumer key/secret](http://docs.apigee.com/management/apis/post/organizations/%7Borg_name%7D/developers/%7Bdeveloper_email_or_id%7D/apps/%7Bapp_name%7D/keys/create)

Use the developer `john@example.com` and the app named `auth0-app`.

[Associate the consumer key and secret with an Apigee product](http://docs.apigee.com/management/apis/post/organizations/%7Borg_name%7D/developers/%7Bdeveloper_email_or_id%7D/apps/%7Bapp_name%7D/keys/%7Bconsumer_key%7D)

The payload for this request is shown below.
```
{ "apiProducts": ["auth0-product"] }
```


## Test the Deployment
After you have your Auth0 configured and you have deployed the proxy you should copy the following command into your browser.  Be sure to update the `{org}`, `{env}` and `{clientID}`.
```
https://{org}-{env}.apigee.net/oauth_auth0/authorize?{client_id}=clientID&response_type=code&redirect_uri=https://callback.io&scope=openid
```

1. You will be redirected to the Auth0 login screen.
  * login with the Auth0 user that you created.  
2. The authorization code will be downloaded to your local machine.
3. Copy the authorization code into the request below. Be sure to update
  * `org`
  * `env`
  * `clientID`
  * `secret`

```
curl -X POST \
  https://{org}-{env}.apigee.net/oauth_auth0/token \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'client_id={clientID}&code={authCode}&grant_type=authorization_code&redirect_uri=https%3A%2F%2Fcallback.io&client_secret={secret}'
```

Now you have a Auth0 JWT that was proxied through Apigee Edge.  

Please note the following:
1. The JWT is not stored in Apigee Edge (TODO create separate repo to demo this)
2. You should validate the JWT with Dino's [JWT Java callout](https://github.com/apigee/iloveapis2015-jwt-jwe-jws).
3. You will miss out on some analytics because the Verify API key/Validate Access Token policy is not included in the proxy, so you won't know who the developer is.
   * However, the JWT includes the client ID, so you could extract that from the JWT and then include a VerifyAPIKey policy on the preflow, they Apigee will know who the developer is and will populate all the analytics associated with the developer.  


# Auth0 Store an External Access Token
This section describes the proxies that are used to save an external access token, either an opaque token or a JWT, within Apigee Edge so that you can still obtain the developer analytics.  It similar to the previous example, but it saves the external authorization code and the access token.  

It consists of two proxies:
1. auth0-oauth-store-jwt - this proxy saves the external access token with Edge.  
2. auth0-test-proxy - this proxy contains the VerifyAccessToken policy to validate the external access token.  

## auth0-oauth-store-jwt
This proxy saves the JWT as an external access token.

1. Create a new client in Auth0 and make sure to set your Auth0 client's redirect URI to
 `https://org-env.apigee.net/oauth_auth0_store_jwt/redirect`  

2. Deploy the proxy
If you are running this for the first time then you must deploy the proxy first, before you run the config step.  Then run the config step below.
```
cd ../auth0-oauth-store-jwt
mvn install -Ptest -Dusername=$ae_username -Dpassword=$ae_password \
                    -Dorg=$ae_org -Dauthtype=oauth
```

If the proxy is deployed, then you can run this step.  It will redeploy the proxy and create the necessary configuration.  
```
mvn install -Ptest -Dusername=$ae_username -Dpassword=$ae_password \
                    -Dorg=$ae_org -Dauthtype=oauth -Dapigee.config.options=create
```

3. Create the client ID and secret in Edge
Once you create the client in Auth0 and create the Apigee product and app, then you have to add the client ID and secret into Apigee Edge. Use the following API calls to add the credentials to Apigee Edge.

[Create a consumer key/secret](http://docs.apigee.com/management/apis/post/organizations/%7Borg_name%7D/developers/%7Bdeveloper_email_or_id%7D/apps/%7Bapp_name%7D/keys/create)

Use the developer `john@example.com` and the app named `auth0-store-jwt-app`.

[Associate the consumer key and secret with an Apigee product](http://docs.apigee.com/management/apis/post/organizations/%7Borg_name%7D/developers/%7Bdeveloper_email_or_id%7D/apps/%7Bapp_name%7D/keys/%7Bconsumer_key%7D)

The payload for this request is shown below.
```
{ "apiProducts": ["auth0-store-jwt-product"] }
```

4. Start Apigee Edge trace and test the deployment
Copy the following command into your browser.  Be sure to update the `{org}`, `{env}` and `{clientID}`.
```
https://{org}-{env}.apigee.net/oauth_auth0/authorize?client_id={client_id}&response_type=code&redirect_uri=https://callback.io&scope=openid
```

* Login to the Auth0 with your username and password.
* Save the authorization code and enter it into the request below.

Request for an access token
```
curl -X POST \
  https://{org}-{env}.apigee.net/oauth_auth0/token \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'client_id={clientID}&code={authCode}&grant_type=authorization_code&redirect_uri=https%3A%2F%2Fcallback.io&client_secret={secret}'
```

Response:
```
{"access_token":"K9Qtbh"
,"expires_in":86400
,"id_token":"eyJ0eXAi....4z6QXOiFZ56VdourjlO2kPr_pxgyHgdw"
,"token_type":"Bearer"}
```

5. Validate the token.
* Use the [management API](http://docs.apigee.com/management/apis/get/organizations/%7Borg_name%7D/oauth2/accesstokens/%7Baccess_token%7D) to confirm token is saved in Apigee Edge.
* OR deploy the proxy below validate the token is stored in Edge.  

## auth0-test-proxy
This proxy have the ValidateAccessToken policy included to validate the external access token, which should be included in the Authorization header (Bearer token).

Please note the following:
* It does not validate the JWT with the public certificate or the claims.
* Edge checks that the token exists in its internal token store and that it has not expired.  

1. Deploy the proxy
```
cd ../auth0-test-proxy
mvn install -Ptest -Dusername=$ae_username -Dpassword=$ae_password \
                    -Dorg=$ae_org -Dauthtype=oauth
```

2. Test the deployment
You can validate that the token that you received above is a valid token in Apigee Edge.
```
curl https://org-env.apigee.net/auth0_test_proxy \
-H 'Authorization: Bearer K9QYwZtbh'
```

You should see the following response:
```
HTTP/1.1 200 OK
< Date: Wed, 21 Jun 2017 17:07:31 GMT
< Content-Type: text/plain
< Content-Length: 60
< Connection: keep-alive
< Server: Apigee Router
<
* Curl_http_done: called premature == 0
* Connection #0 to host org-env.apigee.net left intact
Your jwt is valid, but I didn't validate it with public key!
```

# TODO
1. Create a new repo that demonstrates how to save the JWT as an access token in Apigee Edge. - COMPLETE
2. Create a proxy to demo how to extract the client ID from the JWT and then use the Validate API Key policy to populate all the default analytics.
