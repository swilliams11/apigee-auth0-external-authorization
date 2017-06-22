#auth0-test-proxy
This proxy will prove that the external access token is stored in Apigee Edge.  Follow the main README file.


The request to this endpoint is shown below.
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
Your token is valid!
```
