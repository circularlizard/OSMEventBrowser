## Using the API
Your browser uses a simple API for interacting with OSM, so although our API is unsupported and undocumented, your application will be able to do anything that you can do on the website.

You should use your browser's developer console to watch the network requests that are made when you perform the actions you would like your application to automate. Pay particular attention to whether requests are GET or POST. Then use your OAuth client library to create an authenticated request to the URL you discovered via the console (which will set a 'Bearer token' in the authorisation header).

## Rate limits
Please monitor the standard rate limit headers to ensure your application does not get blocked automatically. Applications that are frequently blocked will be permanently blocked.

**X-RateLimit-Limit** - this is the number of requests per hour that your API can perform (per authenticated user)

**X-RateLimit-Remaining** - this is the number of requests remaining that the current user can perform before they are blocked

**X-RateLimit-Reset** - this is the number of seconds until the rate limit for the current user resets back to your overall limit

An HTTP 429 status code will be sent if the user goes over the limit, along with a Retry-After header with the number of seconds until you can use the API again.

Please also enforce your own lower rate limits, especially if you are allowing unauthenticated users to manipulate your data (e.g. allowing members to join a waiting list).

## Other considerations
Please ensure you check responses and abort if they are not as you expect - your application will get blocked if it frequently performs invalid requests.

Please monitor for a 'X-Deprecated' header - anything with that header will be removed after the date mentioned.

Please monitor for a 'X-Blocked' header - if this is set, your application has been blocked due to using invalid data or attempting to do something it does not have access to use. Continuing to use the API after you have been blocked will automatically change the block to a permanent block.

If you allow unauthenticated uses of your application, ensure you verify the users are not bots.

Always sanitise and validate data input before sending it to OSM - invalid data will result in your application being blocked.