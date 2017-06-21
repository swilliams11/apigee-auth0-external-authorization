var scheme = "https://"
var host = context.getVariable("request.header.Host");
var basePath = context.getVariable("proxy.basepath");
var pathSuffix = "/redirect"

var redirect = scheme + host + basePath + pathSuffix;
context.setVariable("auth0.redirect", redirect);