/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {
    try {
        console.log("Logging in", targetUrl);

        const options = {
            redirect_uri: window.location.origin
        };

        if (targetUrl) {
            options.appState = { targetUrl };
        }

        await auth0.loginWithRedirect(options);
    } catch (err) {
        console.log("Log in failed", err);
    }
};


/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();

    auth0 = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId,
		redirect_uri: "https://kirilpopov.github.io/loginpage/"
    });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
        return fn();
    }

    return login(targetUrl);
};

const done = async () => {
    const user = await auth0.getUser();
    const claims = await auth0.getIdTokenClaims();
    // this will close the auth window
    glue42gd.authDone({ user: user.username, token: claims.__raw });
};

// Will run when page finishes loading
window.onload = async () => {
    await configureClient();
    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
        done();
        return;
    }

    const query = window.location.search;
    const shouldParseResult = query.includes("code=") && query.includes("state=");

    if (shouldParseResult) {
        try {
            await auth0.handleRedirectCallback();
            done();
        } catch (err) {
            console.log("Error parsing redirect:", err);
        }
    } else {
        login();
    }
}
