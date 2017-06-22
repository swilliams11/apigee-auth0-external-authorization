var clientIdRedirect = context.getVariable("cache.clientIdRedirect");

var values = clientIdRedirect.split(";");
context.setVariable("cache.clientId", values[0]);
context.setVariable("cache.redirect", values[1]);