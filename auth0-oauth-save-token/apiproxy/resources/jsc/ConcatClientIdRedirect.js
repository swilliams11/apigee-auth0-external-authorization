var clientId = context.getVariable("request.queryparam.client_id");
var redirect = context.getVariable("request.queryparam.redirect_uri");

cacheValue = clientId + ";" + redirect;
context.setVariable("cache.clientIdRedirect", cacheValue);