var locationTmp = context.getVariable("response.header.Location");
var auth0Domain = context.getVariable("myauthDomain");

var updatedLocation = auth0Domain + locationTmp;
context.setVariable("response.header.Location", updatedLocation);