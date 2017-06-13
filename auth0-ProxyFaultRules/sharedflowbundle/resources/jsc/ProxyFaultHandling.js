var faultName = context.getVariable ("fault.name");
var proxyName = context.getVariable ("apiproxy.name");

var responseCode;
var reasonPhrase;
var code;
var userMessage;
var systemMessage;

switch(faultName) {
    case "InvalidAccessToken" :
    case "invalid_access_token" :
        responseCode = "401";
        reasonPhrase = "Unauthorized";
        code = "401.001";
        userMessage = "Invalid Access Token";
        systemMessage = "Request new access token";
        break;

    case "access_token_expired" :
        responseCode = "401";
        reasonPhrase = "Unauthorized";
        code = "401.002";
        userMessage = "Access Token Expired";
        systemMessage = "Request new access token";
        break;

    case "InvalidAPICallAsNoApiProductMatchFound" :
        responseCode = "401";
        reasonPhrase = "Unauthorized";
        code = "401.003";
        userMessage = "API Product mismatch for token";
        systemMessage = "Application is not authorized to access resource";
        break;

    case "InsufficientScope" :
        responseCode = "401";
        reasonPhrase = "Unauthorized";
        code = "401.004";
        userMessage = "Insufficient scope for Application";
        systemMessage = "Invalid scope for Application";
        break;

    case "SpikeArrestViolation" :
        responseCode = "429";
        reasonPhrase = "Too Many Requests";
        code = "429.001";
        userMessage = "Rate limit exceeded";
        systemMessage = "Rate limit exceeded typical volume";
        break;
    case "invalid_request":
        responseCode = "400";
        reasonPhrase = "Bad Request";
        code = "400.001";
        userMessage = "Invalid redirect URI.";
        systemMessage = context.getVariable("request.uri");
        break;
    case "RaiseFault" :
        var catchAll = context.getVariable("raisefault.RF-CatchAll.failed");
        if( catchAll === true ) {
            responseCode = "405";
            reasonPhrase = "Method Not Allowed";
            code = "405.001";
            userMessage = "Method and/or resource path not allowed";
            systemMessage = context.getVariable("request.uri");
        } else {
            responseCode = "400";
            reasonPhrase = "Bad Request";
            code = "400.001";
            userMessage = "Unknow error occured.";
            systemMessage = context.getVariable("request.uri");
        }
        break;

    default:
        responseCode = "500";
        reasonPhrase = "Internal Error";
        code = "500.001";
        userMessage = "Unknown server error";
        systemMessage = "Something went wrong in the proxy";
}

context.setVariable( "auth0.errorStatusCode", responseCode );
context.setVariable( "auth0.errorReasonPhrase", reasonPhrase );
context.setVariable( "auth0.errorCode", code );
context.setVariable( "auth0.errorUserMessage", userMessage );
context.setVariable( "auth0.errorSystemMessage", systemMessage );
