# FlightCircle API (1.0.0)

[Download OpenAPI Specification (JSON)](flight_circle_openapi_specs.json)

## What is the Flight Circle API?

The Flight Circle API lets your application read and manage aviation data on behalf of Flight Circle users — things like pilot profiles, aircraft, schedules, and flight records. If you're building a third-party integration or an internal tool that connects to Flight Circle, this is the right place to start.

## Getting Started

To use the API, you first need a client_id and a client_secret. Contact the Flight Circle support team to register your app and receive these credentials. The client_secret must be kept private — never include it in client-side code or share it publicly.

## Basics

All API endpoints follow the form:

```http
https://www.flightcircle.com/v1/api/pub/METHOD_NAME
```

All requests must use HTTPS (TLS 1.2 or above).
Do not add a trailing slash to any URL — the server will return a 404 if you do.
Parameters shown in curly brackets in the endpoint docs are path variables. Replace them with actual values: /aircraft/{FboID}/{AircraftID} → /aircraft/100/200.

## The OAuth Flow

Access to user data is controlled through OAuth 2.0 — the same "sign in with Google" pattern you've probably seen before. The idea is simple: the user clicks a button in your app, logs in on the Flight Circle website, and decides what your app is allowed to see. Your app never handles their password.

The result is two tokens:

Access token — a short-lived credential (expires after 1 hour) that your app presents with every API request to prove it has permission. Think of it like a temporary pass.

Refresh token — a longer-lived credential (expires after 180 days, but the clock resets every time you use it) that lets your app silently obtain a new access token when the old one expires, without asking the user to log in again. Keep refresh tokens secure — treat them like passwords and never expose them to the browser or include them in logs.

### OAuth Flow Chart

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Pilot
    participant App as Your Application
    participant FC as Flight Circle OAuth

    App->>User: Redirect to Flight Circle authorization URL<br/>(GET /authorize)
    User->>FC: Log in & authorize application
    FC->>App: Redirect back to Redirect URI<br/>(with temporary code & state)
    Note over App: Verify state matches stored value
    App->>FC: Exchange code for tokens (POST /token)<br/>(with client_id & client_secret)
    FC->>App: Return access_token & refresh_token
```

### Step 1 — Send the user to authorize

Your web or mobile app should send a GET request to:

```http
GET https://www.flightcircle.com/v1/api/pub/authorize
```

Pass these query parameters:

client_id — issued when you registered your app (required)
state — a unique string you generate for this user (optional, but strongly recommended — see below)
Never send client_secret on this request.

Redirect URIs
For security, the URL that Flight Circle redirects the user back to after authorization must be registered with us in advance — you cannot pass it freely in the request. Until you register your own, the default is http://localhost/example/server.php, which is useful for running the example code locally. You must register a production URI before shipping your integration. Contact our support team to register or change your redirect_uri at any time.

State
The state parameter protects against request-forgery attacks. Here's how it works:

Before redirecting the user, generate a value that's unique to this user and store it (e.g. in their session).
Include that value as state in the request to /authorize.
When Flight Circle redirects back to your app, compare the state you receive with the one you stored. If they don't match, reject the request — it may have been initiated by a third party.
The state value also gives you a convenient way to identify which user is completing the flow, since Flight Circle will echo it back to you unchanged.

### Step 2 — Receive the temporary code

If the user approves your app, Flight Circle redirects them back to your redirect_uri with a temporary code in the query string, plus the state you passed in Step 1. Verify the state matches before proceeding. The code can only be used once and expires quickly, so exchange it immediately.

### Step 3 — Exchange the code for tokens

Send a POST request to:

```http
POST https://www.flightcircle.com/v1/api/pub/token
```

With these parameters:

client_id — issued when you registered your app (required)
client_secret — issued when you registered your app (required)
code — the temporary code from Step 2
refresh_token — a refresh token issued by this same endpoint
Do not pass both code and refresh_token — one of the two is required.

Using a code (first-time authorization):

```json
{
  "access_token": "0253071b6d1cce0d119cc968f6b14ceeecc3bj75",
  "refresh_token": "126f4555b483b5e8fae721b773e02fde941a785u"
}
```

Using a refresh_token (renewing an expired access token):

```json
{
  "access_token": "0253071b6d1cce0d119cc968f6b14ceeecc3bj75"
}
```

You can now use the access_token to call API methods on behalf of the user.

## Storing tokens and credentials

Store client_secret, access_token, and refresh_token server-side only.
Never commit them to source control or include them in client-side code.
Encrypt tokens at rest if your storage supports it.

## Using Access Tokens

Include the access token in the Authorization header of every request:

```http
GET /v1/api/pub/user/describe
Authorization: Bearer 0253071b6d1cce0d119cc968f6b14ceeecc3bj75
```

cURL example:

```bash
curl https://www.flightcircle.com/v1/api/pub/user/describe \
  -H "Authorization: Bearer 0253071b6d1cce0d119cc968f6b14ceeecc3bj75"
```

Avoid passing the token as a query string parameter — query strings appear in server logs and browser history, which can expose the token unintentionally.

## Scopes

When authorizing your app, the user grants it one or more scopes that control what data can be accessed:

| Scope   | What it allows                                           | Who can grant it |
| :------ | :------------------------------------------------------- | :--------------- |
| `user`  | Read the authenticated user's own profile and data       | Any user         |
| `fbo`   | Read the FBO's data (aircraft, schedules, members, etc.) | FBO admin only   |
| `write` | Create, update, and delete records                       | FBO admin only   |

## Rate Limits

The API allows up to 100 requests per minute per access token. Exceeding this limit returns a 429 Too Many Requests response. If you hit the limit, wait until the next minute window before retrying.

## Errors

Errors are returned as plain text with a semantically correct HTTP status code. For example, a missing required parameter returns 400 Bad Request, and an expired token returns 401 Unauthorized. Check the status code first, then read the response body for a human-readable explanation.

## Dates

Dates are not yet consistently formatted across all endpoints. We are working to standardise them all to ISO 8601 (e.g. 2024-06-15T14:30:00Z). Until then, treat date formats as endpoint-specific and check the individual endpoint documentation.

## Pagination

Endpoints that return lists do not currently support pagination — all results are returned at once. Pagination is planned for a future release.

## Status & Versioning

The Flight Circle API is currently in beta. Endpoints, parameters, and response shapes may change without prior notice while we iterate. Once the API reaches maturity we will notify all registered integrations at least a couple of weeks before any breaking change is introduced.

## Example Code

The example below shows how to authenticate and call the /user/describe endpoint. Download the example code — it contains three PHP files: client.php, server.php, and describe_user.php.

Make sure you have a local web server running (e.g. Apache or Nginx).
Extract the zip into a folder named example at the root of your web server, so that client.php is accessible at http://localhost/example/client.php.
In client.php, set $client_id to your Client ID.
In server.php, set both $client_id and $client_secret to your credentials.
Open http://localhost/example/client.php in your browser.
You will be redirected to the Flight Circle login page. Log in and authorize the app.
You will be redirected back to http://localhost/example/server.php, which will automatically exchange the code for a token and display it.
Click "Describe user to test token" — this calls /user/describe using your new token and displays your profile data.
If any step fails, contact our support team with the details.

Once you are ready to move beyond local testing, register your production redirect_uri with us before going live.

# Auth

Token emission and verification endpoints:

## Start the OAuth authorization flow

**`GET`** `/authorize`

Redirects the user to the Flight Circle login and authorization page. This endpoint is browser-facing — your app should redirect the user's browser to this URL, not call it from a server.

If the user is not logged in they will see a login form first. After logging in (or if already authenticated) they will be shown an authorization page where they can approve or deny your app's access.

On approval, Flight Circle redirects the user back to your registered redirect_uri with a temporary code and the state you passed in. That code must be exchanged immediately at POST /token.

Note: unlike standard OAuth 2.0, redirect_uri is not a parameter here. Flight Circle uses the URI you registered with our support team. If none has been registered, it defaults to http://localhost/example/server.php.

#### Query Parameters

- `client_id` (`string`, required) - Your app's Client ID, issued when you registered with Flight Circle.
- `state` (`string`, optional) - A unique value you generate for this user (e.g. a random token stored in their session). Flight Circle echoes it back unchanged. Use it to verify the callback is genuine and to identify which user is completing the flow. Strongly recommended.
- `scope` (`string`, optional) - Default: "user" Space-separated list of scopes to request. Defaults to user if omitted. Example: user fbo or user fbo write. See the Scopes section for available values and who can grant each one.
- `response_type` (`string`, optional) - Default: "code" Value: "code" Must be code if provided. Defaults to code automatically.

#### Responses

| Code    | Description                                                                                                                                                                                              | Schema |
| :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| **302** | Redirects to the Flight Circle authorization page (or login page if the user is not authenticated). On completion the user is redirected back to your redirect_uri with code and state query parameters. | —      |
| **400** | Missing or invalid client_id.                                                                                                                                                                            | —      |

______________________________________________________________________

## Issue or refresh an access token

**`POST`** `/token`

Exchanges an authorization code for an access_token and a refresh_token, or exchanges a refresh_token for a new access_token.

Also available at POST /access_token (legacy alias — prefer /token).

The grant_type field is optional: the server defaults to authorization_code when code is present and retries with refresh_token automatically when the code exchange fails.

#### Request Body

**Content-Type:** `application/x-www-form-urlencoded`

- `client_id` (`string`, required) - Your app's Client ID.
- `client_secret` (`string`, required) - Your app's Client Secret. Never expose this client-side.
- `code` (`string`, optional) - The temporary authorization code received from GET /authorize. Provide either code or refresh_token, not both.
- `refresh_token` (`string`, optional) - A refresh token previously issued by this endpoint. Provide either code or refresh_token, not both.
- `grant_type` (`string`, optional) - Enum: "authorization_code" "refresh_token" Defaults to authorization_code when omitted. Set to refresh_token when exchanging a refresh token.

#### Responses

| Code    | Description                              | Schema |
| :------ | :--------------------------------------- | :----- |
| **200** | Tokens issued successfully.              | —      |
| **500** | Invalid or expired code / refresh token. | —      |

#### Request Samples

**Example: First-time authorization**

**Content-Type:** `application/x-www-form-urlencoded`

```json
{
  "client_id": "my-client-id",
  "client_secret": "my-client-secret",
  "code": "abc123temporarycode"
}
```

#### Response Samples

**Example: 200 - Response to authorization code exchange**

**Content-Type:** `application/json`

```json
{
  "access_token": "0253071b6d1cce0d119cc968f6b14ceeecc3bj75",
  "refresh_token": "126f4555b483b5e8fae721b773e02fde941a785u",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

______________________________________________________________________

# Users

User profile and customer management.

## Describe the authenticated user across all FBOs

**`GET`** `/user/describe`

Returns one profile entry per FBO the authenticated user belongs to, each including custom fields scoped to that FBO. Returns an empty array if the user has no active customer records.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Responses

| Code    | Description                                                                 | Schema |
| :------ | :-------------------------------------------------------------------------- | :----- |
| **200** | One profile per FBO the user belongs to.                                    | —      |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | —      |
| **429** |                                                                             | —      |

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "UserID": 0,
    "first_name": "string",
    "middle_name": "string",
    "last_name": "string",
    "FboID": 0,
    "OrganizationName": "string",
    "timezone_string": "America/New_York",
    "email": "user@example.com",
    "custom_fields": {}
  }
]
```

______________________________________________________________________

## Describe the authenticated user scoped to an FBO

**`GET`** `/user/describe/{FboID}`

Returns the authenticated user's profile with custom fields scoped to the given FBO. The FboID must match the API key's FBO (or the API key must have cross-FBO access).

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema |
| :------ | :-------------------------------------------------------------------------- | :----- |
| **200** | User profile.                                                               | —      |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | —      |
| **429** |                                                                             | —      |

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
{
  "UserID": 0,
  "first_name": "string",
  "middle_name": "string",
  "last_name": "string",
  "FboID": 0,
  "OrganizationName": "string",
  "timezone_string": "America/New_York",
  "email": "user@example.com",
  "custom_fields": {
    "property1": "string",
    "property2": "string"
  }
}
```

______________________________________________________________________

## List all customers for an FBO

**`GET`** `/users/{FboID}`

Returns a full list of customers registered with the given FBO, including profile data, certificates, medical records, files, and custom fields.

The caller must be an employee of FboID. Results are ordered by status (DESC) then last name (ASC). Dates and times are returned in the FBO's configured timezone.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of customer records.                                                  | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`integer`, required) - User ID.
- `CustomerID` (`integer`, required)
- `first_name` (`string`, required)
- `last_name` (`string`, required)
- `email` (`string <email>`, optional)
- `Date of Birth` (`string or null <date>`, optional)
- `address` (`string`, optional)
- `address2` (`string`, optional)
- `city` (`string`, optional)
- `state` (`string`, optional)
- `zip_code` (`string`, optional)
- `phone` (`string`, optional)
- `emergency_contact_name` (`string`, optional)
- `emergency_contact_phone` (`string`, optional)
- `balance` (`number <float>`, optional) - Account balance rounded to 2 decimal places.
- `created` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `Last Medical` (`string or null`, optional)
- `Medical Expiration` (`string or null`, optional)
- `Last FAA Flight Review` (`string or null`, optional)
- `Renter's Insurance Expires` (`string or null`, optional)
- `Last Local Flight Review` (`string or null`, optional)
- `company_name` (`string`, optional)
- `Certificate` (`string`, optional)
- `Certificate Type` (`string`, optional)
- `Issued By` (`string`, optional)
- `Certificate Number` (`string`, optional)
- `Date Issued` (`string or null`, optional)
- `Date Expires` (`string or null`, optional)
- `CFI Expiration` (`string or null`, optional)
- `Craft Categories` (`Array of strings`, optional)
- `Class Ratings` (`Array of strings`, optional)
- `Endorsements` (`Array of strings`, optional)
- `Other Ratings` (`Array of strings`, optional)
- `Status` (`string`, required) - Enum: "Deleted" "Active" "Pending" "ERROR"
- `file_categories` (`Array of strings`, optional) - Active file categories configured for this user.
- `files` (`Array of objects (UserFileListItem)`, optional)
- `custom_fields` (`object`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": 0,
    "CustomerID": 0,
    "first_name": "string",
    "last_name": "string",
    "email": "user@example.com",
    "Date of Birth": "2019-08-24",
    "address": "string",
    "address2": "string",
    "city": "string",
    "state": "string",
    "zip_code": "string",
    "phone": "string",
    "emergency_contact_name": "string",
    "emergency_contact_phone": "string",
    "balance": 0.1,
    "created": "2019-08-24T14:15:22Z",
    "Last Medical": "string",
    "Medical Expiration": "string",
    "Last FAA Flight Review": "string",
    "Renter's Insurance Expires": "string",
    "Last Local Flight Review": "string",
    "company_name": "string",
    "Certificate": "string",
    "Certificate Type": "string",
    "Issued By": "string",
    "Certificate Number": "string",
    "Date Issued": "string",
    "Date Expires": "string",
    "CFI Expiration": "string",
    "Craft Categories": [],
    "Class Ratings": [],
    "Endorsements": [],
    "Other Ratings": [],
    "Status": "Deleted",
    "file_categories": [],
    "files": [],
    "custom_fields": {}
  }
]
```

______________________________________________________________________

## Create a new user / customer

**`POST`** `/users`

Creates a new user account and associated customer record for the FBO identified by the API key.

Rate limit: Returns 409 if more than 200 customers are created within a 24-hour window for the same FBO.

A random password is generated automatically; a welcome/verification email is dispatched asynchronously.

**Authorizations:**

- OAuth 2.0 (`oauth (write)`)
  - **OAuth2**: `oauth`
  - **Flow type**: `authorizationCode`
  - **Authorization URL**: `/v1/api/pub/authorize`
  - **Token URL**: `/v1/api/pub/token`
  - **Required scopes**: `write`
    - `user`: Read the authenticated user's own profile and data
    - `fbo`: Read the FBO's data (aircraft, schedules, members, etc.)
    - `write`: Create, update, and delete records

#### Request Body

**Content-Type:** `application/json`

- `first_name` (`string <= 255 characters`, required)
- `last_name` (`string <= 255 characters`, required)
- `middle_name` (`string <= 255 characters`, optional)
- `email` (`string <email> <= 255 characters`, optional)
- `date_of_birth` (`string <date>`, optional) - Format YYYY-MM-DD.
- `address` (`string <= 255 characters`, optional)
- `address2` (`string <= 255 characters`, optional)
- `city` (`string <= 255 characters`, optional)
- `state` (`string <= 255 characters`, optional)
- `zip_code` (`string <= 255 characters`, optional)
- `phone` (`string <= 20 characters`, optional)
- `emergency_contact_name` (`string <= 255 characters`, optional)
- `emergency_contact_phone` (`string <= 20 characters`, optional)
- `company_name` (`string <= 255 characters`, optional)
- `notes` (`string or null <= 255 characters`, optional)
- `status` (`string`, optional) - Enum: "0" "1" "2" Customer status. "0" = Inactive, "1" = Active, "2" = Pending.
- `medical_class` (`string`, optional) - Allowed values depend on the FBO's aviation authority. FAA base set: Class 1, Class 2, Class 3, BasicMed, Military, Other, Sport Pilot (Drivers License). CASA adds Basic Class 2.
- `medical_date` (`string <date>`, optional)
- `medical_expires` (`string <date>`, optional)
- `last_bfr` (`string or null <date>`, optional)
- `renters_insurance_expires` (`string <date>`, optional)
- `last_local_flight_review` (`string or null <date>`, optional)
- `certificate` (`string`, optional) - Enum: "Pilot" "Instructor" "Remote Pilot"
- `certificate_type` (`string`, optional) - Allowed values depend on the FBO's aviation authority. Base set: Student, Sport, Recreational, Private, Commercial, ATP. EASA adds SPL, LAPLA, LAPLS, PPL.
- `issued_by` (`string <= 255 characters`, optional)
- `certificate_number` (`string or null <= 255 characters`, optional)
- `date_issued` (`string <date>`, optional)
- `date_expires` (`string <date>`, optional)
- `cfi_expiration` (`string or null <date>`, optional)
- `craft_categories` (`Array of strings`, optional) - Each entry must be one of the allowed values for the FBO's aviation authority. FAA base set: Airplane, Rotocraft, Powered Lift, Glider, Lighter-than-air, Weight-Shift Control. EASA adds TMG.
- `class_ratings` (`Array of strings`, optional) - FBO-authority dependent enum. Base set includes Single Engine Land, Single Engine Sea, Multi Engine Land, Multi Engine Sea, Helicopter, Gyroplane, Airship, Gas Balloon, Hot Air Balloon, Weight-Shift Control: Land, Weight-Shift Control: Sea. EASA adds TMG, Gliders.
- `endorsements` (`Array of strings`, optional) - FBO-authority dependent enum. Base set: Tailwheel, High Performance, Complex, Solo, Pressurized, Ground-tow, Aero-tow, Self-launch. EASA and CASA each extend the list.
- `other_ratings` (`Array of strings`, optional) - FBO-authority dependent enum. Base set: Instrument Airplane, Instrument Helicopter, Instrument Powered Lift, Night (EASA), Small Unmanned Aircraft System. EASA adds Towing, TMG Night Rating, Aerobatic.
- `send_customer_verification_email` (`integer`, optional) - Enum: 0 1 When 1, the server dispatches a verification email to the new customer. Defaults to no email if omitted.

#### Responses

| Code    | Description                                                                                                                                                                                       | Schema |
| :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----- |
| **201** | User and customer created successfully.                                                                                                                                                           | —      |
| **403** | Not authorized. The authenticated user lacks permission for this operation.                                                                                                                       | —      |
| **422** | Validation failure or business-rule violation. Covers field validation failures, duplicate email, and the daily creation cap (more than 200 customers created in the last 24 hours for this FBO). | —      |
| **429** |                                                                                                                                                                                                   | —      |
| **500** | Unexpected server error. Body is a plain-text message.                                                                                                                                            | —      |

#### Request Samples

**Example: Minimal request**

**Content-Type:** `application/json`

```json
{
  "first_name": "Jane",
  "last_name": "Doe"
}
```

#### Response Samples

**Example: 201 / 403**

**Content-Type:** `application/json`

```json
{
  "UserID": 4201,
  "CustomerID": 1337
}
```

______________________________________________________________________

## Update a customer profile

**`PUT`** `/users/{UserID}`

Updates a customer profile. Any subset of profile fields may be provided.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `UserID` (`integer >= 1`, required) - User identifier.

#### Request Body

**Content-Type:** `application/json`

- `first_name` (`string <= 255 characters`, optional)
- `last_name` (`string <= 255 characters`, optional)
- `middle_name` (`string <= 255 characters`, optional)
- `email` (`string <email> <= 255 characters`, optional)
- `date_of_birth` (`string <date>`, optional) - Format YYYY-MM-DD.
- `address` (`string <= 255 characters`, optional)
- `address2` (`string <= 255 characters`, optional)
- `city` (`string <= 255 characters`, optional)
- `state` (`string <= 255 characters`, optional)
- `zip_code` (`string <= 255 characters`, optional)
- `phone` (`string <= 20 characters`, optional)
- `emergency_contact_name` (`string <= 255 characters`, optional)
- `emergency_contact_phone` (`string <= 20 characters`, optional)
- `company_name` (`string <= 255 characters`, optional)
- `notes` (`string or null <= 255 characters`, optional)
- `status` (`string`, optional) - Enum: "0" "1" "2" Customer status. "0" = Inactive, "1" = Active, "2" = Pending.
- `medical_class` (`string`, optional) - Allowed values depend on the FBO's aviation authority. FAA base set: Class 1, Class 2, Class 3, BasicMed, Military, Other, Sport Pilot (Drivers License). CASA adds Basic Class 2.
- `medical_date` (`string <date>`, optional)
- `medical_expires` (`string <date>`, optional)
- `last_bfr` (`string or null <date>`, optional)
- `renters_insurance_expires` (`string <date>`, optional)
- `last_local_flight_review` (`string or null <date>`, optional)
- `certificate` (`string`, optional) - Enum: "Pilot" "Instructor" "Remote Pilot"
- `certificate_type` (`string`, optional) - Allowed values depend on the FBO's aviation authority. Base set: Student, Sport, Recreational, Private, Commercial, ATP. EASA adds SPL, LAPLA, LAPLS, PPL.
- `issued_by` (`string <= 255 characters`, optional)
- `certificate_number` (`string or null <= 255 characters`, optional)
- `date_issued` (`string <date>`, optional)
- `date_expires` (`string <date>`, optional)
- `cfi_expiration` (`string or null <date>`, optional)
- `craft_categories` (`Array of strings`, optional) - Each entry must be one of the allowed values for the FBO's aviation authority. FAA base set: Airplane, Rotocraft, Powered Lift, Glider, Lighter-than-air, Weight-Shift Control. EASA adds TMG.
- `class_ratings` (`Array of strings`, optional) - FBO-authority dependent enum. Base set includes Single Engine Land, Single Engine Sea, Multi Engine Land, Multi Engine Sea, Helicopter, Gyroplane, Airship, Gas Balloon, Hot Air Balloon, Weight-Shift Control: Land, Weight-Shift Control: Sea. EASA adds TMG, Gliders.
- `endorsements` (`Array of strings`, optional) - FBO-authority dependent enum. Base set: Tailwheel, High Performance, Complex, Solo, Pressurized, Ground-tow, Aero-tow, Self-launch. EASA and CASA each extend the list.
- `other_ratings` (`Array of strings`, optional) - FBO-authority dependent enum. Base set: Instrument Airplane, Instrument Helicopter, Instrument Powered Lift, Night (EASA), Small Unmanned Aircraft System. EASA adds Towing, TMG Night Rating, Aerobatic.

#### Responses

| Code    | Description                                                                                                                | Schema |
| :------ | :------------------------------------------------------------------------------------------------------------------------- | :----- |
| **200** | Update applied. Empty response body.                                                                                       | —      |
| **403** | Not authorized. The authenticated user lacks permission for this operation.                                                | —      |
| **422** | Validation failure or business-rule violation — e.g. invalid field value or the target user is not a customer of this FBO. | —      |
| **429** |                                                                                                                            | —      |
| **500** | Unexpected server error. Body is a plain-text message.                                                                     | —      |

#### Request Samples

**Example: Rename only**

**Content-Type:** `application/json`

```json
{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

#### Response Samples

**Example: 403**

**Content-Type:** `text/plain`

```json
"Not authorized"
```

______________________________________________________________________

# User Files

File upload, download, and metadata management for users.

## List files for a user

**`GET`** `/users/{UserID}/files`

Returns all files associated with the given user and the FBO of the API key. The caller must be an employee of that FBO, and the user must be an active customer (status ≠ 0).

Timestamps are returned in UTC ISO 8601 format. Categories are returned as an array of strings. The url field in each item points to the download endpoint for that file.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `UserID` (`integer >= 1`, required) - User identifier.

#### Responses

| Code    | Description                                                                 | Schema |
| :------ | :-------------------------------------------------------------------------- | :----- |
| **200** | Array of file records.                                                      | —      |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | —      |
| **404** | The requested resource was not found.                                       | —      |
| **429** |                                                                             | —      |

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "abc123xyz",
    "name": "Medical Certificate",
    "categories": [],
    "size": 204800,
    "created": "2025-03-10T18:22:00Z",
    "expires": "2026-03-10T04:59:59Z",
    "status": 1,
    "url": "/users/42/files/abc123xyz"
  }
]
```

______________________________________________________________________

## Upload a file for a user

**`POST`** `/users/{UserID}/files`

Uploads a file and attaches it to the given user record.

Send a multipart/form-data request with:

file: the binary file payload.
data: a JSON string containing optional metadata fields (name, categories, expires).
Allowed file extensions: .txt, .jpg, .jpeg, .gif, .png, .doc, .docx, .xls, .xlsx, .pdf, .csv, .numbers, .webp, .ozacft, .pptx, .zip

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `UserID` (`integer >= 1`, required) - User identifier.

#### Request Body

**Content-Type:** `multipart/form-data`

- `file` (`string <binary>`, required) - The file to upload.
- `data` (`string`, optional) - JSON string containing optional metadata: name, categories, expires.

#### Responses

| Code    | Description                                                                                                                                                                                                                                                       | Schema             |
| :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------- |
| **201** | File uploaded and record created.                                                                                                                                                                                                                                 | `application/json` |
| **403** | Not authorized. Either the token lacks the required scope, the caller is not an employee of this FBO, or the target user is not an active customer of this FBO.                                                                                                   | `text/plain`       |
| **422** | Validation failed. Possible causes:<br/>- No file provided<br/>- filename exceeds 255 characters<br/>- name exceeds 255 characters<br/>- File extension not in the allowed list<br/>- expires is not a valid ISO 8601 date/time<br/>- File is empty or unreadable | `text/plain`       |
| **429** |                                                                                                                                                                                                                                                                   | —                  |
| **500** | Unexpected server error. Body is a plain-text message.                                                                                                                                                                                                            | `text/plain`       |

##### Response Schema (201)

**Content-Type:** `application/json`

- `FileID` (`string`, required) - Identifier of the newly created file record.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (422)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (500)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 201**

**Content-Type:** `application/json`

```json
{
  "FileID": "abc123xyz"
}
```

______________________________________________________________________

## Download a file

**`GET`** `/users/{UserID}/files/{FileID}`

Redirects to a signed S3 URL for the requested file. The signed URL expires shortly after issuance — follow the redirect immediately.

The file must belong to the FBO of the API key and the specified user.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `UserID` (`integer >= 1`, required) - User identifier.
- `FileID` (`string`, required) - File identifier (random UUID-like string).

#### Responses

| Code    | Description                                                                                                                       | Schema       |
| :------ | :-------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| **302** | - Redirect to signed S3 download URL.<br/>- Response Headers<br/>- Location<br/>- string <uri><br/>- Signed S3 URL (short-lived). | —            |
| **403** | Not authorized. The authenticated user lacks permission for this operation.                                                       | `text/plain` |
| **404** | The requested resource was not found.                                                                                             | `text/plain` |
| **429** | https://www.flightcircle.com/v1/api/pub/users/{UserID}/files/{FileID}                                                             | —            |

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (404)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 403**

**Content-Type:** `text/plain`

```json
"Not authorized"
```

______________________________________________________________________

## Update file metadata

**`PUT`** `/users/{UserID}/files/{FileID}`

Updates one or more metadata fields of an existing file record. The file content itself is not changed.

At least one of name, categories, or expires must be provided.

expires accepts ISO 8601 date ("2030-06-15") or datetime ("2030-06-15T14:30:00-05:00"). Date-only values are resolved to end-of-day in the FBO's configured timezone, then stored as a UTC Unix timestamp.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `UserID` (`integer >= 1`, required) - User identifier.
- `FileID` (`string`, required) - File identifier (random UUID-like string).

#### Request Body

**Content-Type:** `application/json`

- `name` (`string <= 255 characters`, optional) - New display name for the file.
- `categories` (`string or Array of strings`, optional)
- `expires` (`string`, optional) - New expiration date/time. Accepts ISO 8601 date ("2030-06-15") or datetime ("2030-06-15T14:30:00Z", "2030-06-15T14:30:00-05:00"). Date-only values are interpreted as end-of-day in the FBO's timezone. Pass an empty string to clear expiration.

#### Responses

| Code    | Description                                                                 | Schema             |
| :------ | :-------------------------------------------------------------------------- | :----------------- |
| **200** | File metadata updated.                                                      | `application/json` |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`       |
| **404** | File not found or does not belong to this FBO/user.                         | `text/plain`       |
| **422** | Validation failed. Response body lists each failing assertion.              | `text/plain`       |
| **429** |                                                                             | —                  |
| **500** | Unexpected server error. Body is a plain-text message.                      | `text/plain`       |

##### Response Schema (200)

**Content-Type:** `application/json`

- `success` (`boolean`, required)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (404)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (422)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (500)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Request Samples

**Example: Rename only**

**Content-Type:** `application/json`

```json
{
  "name": "Updated Medical Certificate"
}
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
{
  "success": true
}
```

______________________________________________________________________

## Delete a file

**`DELETE`** `/users/{UserID}/files/{FileID}`

Permanently deletes the file record and the underlying S3 object. This operation is irreversible.

The file must belong to the FBO of the API key and the specified user.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `UserID` (`integer >= 1`, required) - User identifier.
- `FileID` (`string`, required) - File identifier (random UUID-like string).

#### Responses

| Code    | Description                                                                 | Schema       |
| :------ | :-------------------------------------------------------------------------- | :----------- |
| **204** | File deleted. No response body.                                             | —            |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain` |
| **404** | File not found or does not belong to this FBO/user.                         | `text/plain` |
| **429** |                                                                             | —            |
| **500** | Unexpected server error. Body is a plain-text message.                      | `text/plain` |

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (404)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (500)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 403**

**Content-Type:** `text/plain`

```json
"Not authorized"
```

______________________________________________________________________

# Aircraft

Aircraft records, squawks, and maintenance reminders.

## List all aircraft for an FBO

**`GET`** `/aircraft/{FboID}`

Returns all active aircraft registered to the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of aircraft records.                                                  | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional) - Aircraft identifier.
- `FboID` (`string`, optional)
- `tail_number` (`string`, optional)
- `serial` (`string or null`, optional)
- `year` (`string or null`, optional)
- `make` (`string`, optional)
- `model` (`string`, optional)
- `category` (`string`, optional)
- `preferred_name` (`string`, optional)
- `hourly_rate` (`string`, optional) - Hourly rental rate. May be "NaN" if not configured.
- `equipment` (`Array of strings`, optional)
- `requirements` (`Array of strings`, optional)
- `seats` (`string`, optional)
- `range` (`string`, optional)
- `engines` (`string`, optional)
- `hobbs_total` (`string`, optional)
- `tach_total` (`string`, optional)
- `description` (`string or null`, optional)
- `photo` (`string or null`, optional) - Filename of the aircraft photo, or null.
- `status` (`string`, optional) - Enum: "0" "1" "2" 0 = offline, 1 = online, 2 = staff only.
- `enabled` (`string`, optional) - Enum: "0" "1" 0 = deleted, 1 = enabled.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "FboID": "string",
    "tail_number": "string",
    "serial": "string",
    "year": "string",
    "make": "string",
    "model": "string",
    "category": "Airplane",
    "preferred_name": "string",
    "hourly_rate": "string",
    "equipment": [
      "string"
    ],
    "requirements": [
      "string"
    ],
    "seats": "string",
    "range": "string",
    "engines": "string",
    "hobbs_total": "string",
    "tach_total": "string",
    "description": "string",
    "photo": "string",
    "status": "0",
    "enabled": "0"
  }
]
```

______________________________________________________________________

## Get a single aircraft

**`GET`** `/aircraft/{FboID}/{AircraftID}`

Returns the aircraft record for the given AircraftID within the FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `AircraftID` (`integer >= 1`, required) - Aircraft identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array containing the matching aircraft record.                              | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **404** | The requested resource was not found.                                       | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional) - Aircraft identifier.
- `FboID` (`string`, optional)
- `tail_number` (`string`, optional)
- `serial` (`string or null`, optional)
- `year` (`string or null`, optional)
- `make` (`string`, optional)
- `model` (`string`, optional)
- `category` (`string`, optional)
- `preferred_name` (`string`, optional)
- `hourly_rate` (`string`, optional) - Hourly rental rate. May be "NaN" if not configured.
- `equipment` (`Array of strings`, optional)
- `requirements` (`Array of strings`, optional)
- `seats` (`string`, optional)
- `range` (`string`, optional)
- `engines` (`string`, optional)
- `hobbs_total` (`string`, optional)
- `tach_total` (`string`, optional)
- `description` (`string or null`, optional)
- `photo` (`string or null`, optional) - Filename of the aircraft photo, or null.
- `status` (`string`, optional) - Enum: "0" "1" "2" 0 = offline, 1 = online, 2 = staff only.
- `enabled` (`string`, optional) - Enum: "0" "1" 0 = deleted, 1 = enabled.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (404)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "FboID": "string",
    "tail_number": "string",
    "serial": "string",
    "year": "string",
    "make": "string",
    "model": "string",
    "category": "Airplane",
    "preferred_name": "string",
    "hourly_rate": "string",
    "equipment": [
      "string"
    ],
    "requirements": [
      "string"
    ],
    "seats": "string",
    "range": "string",
    "engines": "string",
    "hobbs_total": "string",
    "tach_total": "string",
    "description": "string",
    "photo": "string",
    "status": "0",
    "enabled": "0"
  }
]
```

______________________________________________________________________

## List all open squawks for an FBO

**`GET`** `/squawks/{FboID}`

Returns all open squawks across all aircraft for the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of squawk records.                                                    | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `AircraftID` (`string`, optional)
- `FboID` (`string`, optional)
- `ID` (`string`, optional) - Squawk identifier (hash string).
- `UserID` (`string`, optional)
- `tail_number` (`string`, optional)
- `actions_taken` (`string or null`, optional)
- `created` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `description` (`string`, optional)
- `status` (`string`, optional) - Squawk status code.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "AircraftID": "string",
    "FboID": "string",
    "ID": "string",
    "UserID": "string",
    "tail_number": "string",
    "actions_taken": "string",
    "created": "2019-08-24T14:15:22Z",
    "description": "string",
    "status": "string"
  }
]
```

______________________________________________________________________

## Get squawks by aircraft or squawk ID

**`GET`** `/squawks/{FboID}/{ID}`

Filters squawks by ID. The {ID} parameter is dual-purpose:

Numeric AircraftID — returns all squawks for that aircraft.
Hash-string SquawkID — returns the single matching squawk.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `ID` (`string`, required) - Either a numeric AircraftID (returns all records for that aircraft) or a hash-string record ID (returns the single matching record).

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of matching squawk records.                                           | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **404** | The requested resource was not found.                                       | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `AircraftID` (`string`, optional)
- `FboID` (`string`, optional)
- `ID` (`string`, optional) - Squawk identifier (hash string).
- `UserID` (`string`, optional)
- `tail_number` (`string`, optional)
- `actions_taken` (`string or null`, optional)
- `created` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `description` (`string`, optional)
- `status` (`string`, optional) - Squawk status code.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (404)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "AircraftID": "string",
    "FboID": "string",
    "ID": "string",
    "UserID": "string",
    "tail_number": "string",
    "actions_taken": "string",
    "created": "2019-08-24T14:15:22Z",
    "description": "string",
    "status": "string"
  }
]
```

______________________________________________________________________

## List all maintenance reminders for an FBO

**`GET`** `/maintenancereminders/{FboID}`

Returns all maintenance reminders split into upcoming (reminders) and past-due (expired).

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema             |
| :------ | :-------------------------------------------------------------------------- | :----------------- |
| **200** | Reminders and expired items.                                                | `application/json` |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`       |
| **429** |                                                                             | —                  |

##### Response Schema (200)

**Content-Type:** `application/json`

- `reminders` (`Array of objects (MaintenanceReminderItem)`, required)
- `expired` (`Array of objects (MaintenanceReminderItem)`, required)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
{
  "reminders": [
    {
      "label": "string",
      "aircraft": "string",
      "make": "string",
      "model": "string",
      "preferred_name": "string",
      "tail_number": "string",
      "AircraftID": "string",
      "FboID": "string",
      "ID": "string",
      "measurement": "string",
      "meter": "string",
      "notes": "string",
      "progress": "string",
      "progress2": "string",
      "remaining": "string",
      "remaining2": "string",
      "goal_date": "string",
      "goal2": "string",
      "last_date": "string",
      "last": 0,
      "next": 0,
      "next2": 0,
      "now": "string",
      "timezone_string": "America/New_York"
    }
  ],
  "expired": [
    {
      "label": "string",
      "aircraft": "string",
      "make": "string",
      "model": "string",
      "preferred_name": "string",
      "tail_number": "string",
      "AircraftID": "string",
      "FboID": "string",
      "ID": "string",
      "measurement": "string",
      "meter": "string",
      "notes": "string",
      "progress": "string",
      "progress2": "string",
      "remaining": "string",
      "remaining2": "string",
      "goal_date": "string",
      "goal2": "string",
      "last_date": "string",
      "last": 0,
      "next": 0,
      "next2": 0,
      "now": "string",
      "timezone_string": "America/New_York"
    }
  ]
}
```

______________________________________________________________________

## Get maintenance reminders by aircraft or reminder ID

**`GET`** `/maintenancereminders/{FboID}/{ID}`

Filters maintenance reminders by ID. The {ID} parameter is dual-purpose:

Numeric AircraftID — returns all reminders for that aircraft.
Hash-string ReminderID — returns the single matching reminder.
Response structure is identical to the FBO-wide list.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `ID` (`string`, required) - Either a numeric AircraftID (returns all records for that aircraft) or a hash-string record ID (returns the single matching record).

#### Responses

| Code    | Description                                                                 | Schema             |
| :------ | :-------------------------------------------------------------------------- | :----------------- |
| **200** | Reminders and expired items for the given aircraft or reminder.             | `application/json` |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`       |
| **404** | The requested resource was not found.                                       | `text/plain`       |
| **429** |                                                                             | —                  |

##### Response Schema (200)

**Content-Type:** `application/json`

- `reminders` (`Array of objects (MaintenanceReminderItem)`, required)
- `expired` (`Array of objects (MaintenanceReminderItem)`, required)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (404)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
{
  "reminders": [
    {
      "label": "string",
      "aircraft": "string",
      "make": "string",
      "model": "string",
      "preferred_name": "string",
      "tail_number": "string",
      "AircraftID": "string",
      "FboID": "string",
      "ID": "string",
      "measurement": "string",
      "meter": "string",
      "notes": "string",
      "progress": "string",
      "progress2": "string",
      "remaining": "string",
      "remaining2": "string",
      "goal_date": "string",
      "goal2": "string",
      "last_date": "string",
      "last": 0,
      "next": 0,
      "next2": 0,
      "now": "string",
      "timezone_string": "America/New_York"
    }
  ],
  "expired": [
    {
      "label": "string",
      "aircraft": "string",
      "make": "string",
      "model": "string",
      "preferred_name": "string",
      "tail_number": "string",
      "AircraftID": "string",
      "FboID": "string",
      "ID": "string",
      "measurement": "string",
      "meter": "string",
      "notes": "string",
      "progress": "string",
      "progress2": "string",
      "remaining": "string",
      "remaining2": "string",
      "goal_date": "string",
      "goal2": "string",
      "last_date": "string",
      "last": 0,
      "next": 0,
      "next2": 0,
      "now": "string",
      "timezone_string": "America/New_York"
    }
  ]
}
```

______________________________________________________________________

# Flights

Reservations, instructor schedules, checked-in flight records, and instructor information.

## List all instructors for an FBO

**`GET`** `/instructors/{FboID}`

Returns all instructors registered with the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of instructor records.                                                | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional)
- `FboID` (`string`, optional)
- `CustomerID` (`string or null`, optional)
- `InstructorID` (`string`, optional)
- `UserID` (`string`, optional)
- `email` (`string <email>`, optional)
- `enabled` (`string`, optional) - Enum: "0" "1"
- `first_name` (`string`, optional)
- `middle_name` (`string or null`, optional)
- `last_name` (`string`, optional)
- `phone` (`string or null`, optional)
- `photo` (`string or null`, optional)
- `flight_rate` (`string`, optional) - Per-hour flight instruction rate.
- `classroom_rate` (`string`, optional) - Per-hour ground/classroom instruction rate.
- `sort_order` (`string or null`, optional)
- `show_on_schedule` (`string or null`, optional)
- `staff_only` (`string or null`, optional)
- `status` (`string or null`, optional)
- `share_email` (`string or null`, optional)
- `share_phone` (`string or null`, optional)
- `description` (`string or null`, optional)
- `aircraft_checkouts` (`Array of strings or null`, optional) - List of aircraft IDs this instructor is checked out on.
- `last_rental` (`string or null`, optional) - Unix timestamp of last rental.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "FboID": "string",
    "CustomerID": "string",
    "InstructorID": "string",
    "UserID": "string",
    "email": "user@example.com",
    "enabled": "0",
    "first_name": "string",
    "middle_name": "string",
    "last_name": "string",
    "phone": "string",
    "photo": "string",
    "flight_rate": "string",
    "classroom_rate": "string",
    "sort_order": "string",
    "show_on_schedule": "string",
    "staff_only": "string",
    "status": "string",
    "share_email": "string",
    "share_phone": "string",
    "description": "string",
    "aircraft_checkouts": [
      "string"
    ],
    "last_rental": "string"
  }
]
```

______________________________________________________________________

## Get a single instructor

**`GET`** `/instructors/{FboID}/{InstructorID}`

Returns the instructor record for the given InstructorID within the FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `InstructorID` (`string`, required) - Instructor identifier, or the literal string "all" to include all instructors.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array containing the matching instructor record.                            | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **404** | The requested resource was not found.                                       | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional)
- `FboID` (`string`, optional)
- `CustomerID` (`string or null`, optional)
- `InstructorID` (`string`, optional)
- `UserID` (`string`, optional)
- `email` (`string <email>`, optional)
- `enabled` (`string`, optional) - Enum: "0" "1"
- `first_name` (`string`, optional)
- `middle_name` (`string or null`, optional)
- `last_name` (`string`, optional)
- `phone` (`string or null`, optional)
- `photo` (`string or null`, optional)
- `flight_rate` (`string`, optional) - Per-hour flight instruction rate.
- `classroom_rate` (`string`, optional) - Per-hour ground/classroom instruction rate.
- `sort_order` (`string or null`, optional)
- `show_on_schedule` (`string or null`, optional)
- `staff_only` (`string or null`, optional)
- `status` (`string or null`, optional)
- `share_email` (`string or null`, optional)
- `share_phone` (`string or null`, optional)
- `description` (`string or null`, optional)
- `aircraft_checkouts` (`Array of strings or null`, optional) - List of aircraft IDs this instructor is checked out on.
- `last_rental` (`string or null`, optional) - Unix timestamp of last rental.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

##### Response Schema (404)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "FboID": "string",
    "CustomerID": "string",
    "InstructorID": "string",
    "UserID": "string",
    "email": "user@example.com",
    "enabled": "0",
    "first_name": "string",
    "middle_name": "string",
    "last_name": "string",
    "phone": "string",
    "photo": "string",
    "flight_rate": "string",
    "classroom_rate": "string",
    "sort_order": "string",
    "show_on_schedule": "string",
    "staff_only": "string",
    "status": "string",
    "share_email": "string",
    "share_phone": "string",
    "description": "string",
    "aircraft_checkouts": [
      "string"
    ],
    "last_rental": "string"
  }
]
```

______________________________________________________________________

## List instructor schedules

**`GET`** `/schedules/{FboID}/{InstructorID}/{year}/{month}/{day}/{eyear}/{emonth}/{eday}`

Returns reservations for the given instructor within a date range.

InstructorID may be the literal string "all" to return schedules for all instructors.

Date segments are optional from the right. The server supports truncated paths — you may omit trailing segments:

/schedules/{FboID}/{InstructorID} — returns today and tomorrow.
/schedules/{FboID}/{InstructorID}/{year} — returns today and tomorrow (year alone acts as the today/tomorrow shortcut).
/schedules/{FboID}/{InstructorID}/{year}/{month}/{day} — returns from that start date with no defined end.
Full path — returns the range from start to end date (inclusive).

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `InstructorID` (`string`, required) - Instructor identifier, or the literal string "all" to include all instructors.
- `year` (`integer`, required) - Example: 2024 4-digit start year.
- `month` (`integer [ 1 .. 12 ]`, required) - Example: 6 2-digit start month.
- `day` (`integer [ 1 .. 31 ]`, required) - Example: 1 2-digit start day.
- `eyear` (`integer`, required) - Example: 2024 4-digit end year.
- `emonth` (`integer [ 1 .. 12 ]`, required) - Example: 6 2-digit end month.
- `eday` (`integer [ 1 .. 31 ]`, required) - Example: 30 2-digit end day.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of schedule records.                                                  | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `AircraftID` (`string or null`, optional)
- `FboID` (`string`, optional)
- `ID` (`string`, optional) - Schedule identifier (hash string).
- `InstructorID` (`string or null`, optional)
- `UserID` (`string`, optional)
- `timezone_string` (`string`, optional)
- `arrival_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `depart_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `reservation_type` (`string`, optional)
- `pilot_name` (`string`, optional)
- `instructor_name` (`string or null`, optional)
- `pilot_name_share` (`string or null`, optional)
- `aircraft` (`string or null`, optional) - Full aircraft name including year.
- `preferred_name` (`string or null`, optional)
- `tail_number` (`string or null`, optional)
- `aircraft_status` (`string or null`, optional)
- `dispatched` (`string or null`, optional)
- `checkedin` (`string or null`, optional)
- `public_notes` (`string or null`, optional)
- `private_notes` (`string or null`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "AircraftID": "string",
    "FboID": "string",
    "ID": "string",
    "InstructorID": "string",
    "UserID": "string",
    "timezone_string": "America/New_York",
    "arrival_date": "2019-08-24T14:15:22Z",
    "depart_date": "2019-08-24T14:15:22Z",
    "reservation_type": "Primary",
    "pilot_name": "string",
    "instructor_name": "string",
    "pilot_name_share": "string",
    "aircraft": "string",
    "preferred_name": "string",
    "tail_number": "string",
    "aircraft_status": "string",
    "dispatched": "string",
    "checkedin": "string",
    "public_notes": "string",
    "private_notes": "string"
  }
]
```

______________________________________________________________________

## List checked-in flights

**`GET`** `/flights/{FboID}`

Returns flight records (checked-in reservations) for the given FBO within the specified date range. Only flights that have been checked in are returned.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Query Parameters

- `year` (`integer`, required) - Example: year=2024 4-digit start year.
- `month` (`integer [ 1 .. 12 ]`, required) - Example: month=1 2-digit start month.
- `day` (`integer [ 1 .. 31 ]`, required) - Example: day=1 2-digit start day.
- `eyear` (`integer`, required) - Example: eyear=2024 4-digit end year.
- `emonth` (`integer [ 1 .. 12 ]`, required) - Example: emonth=12 2-digit end month.
- `eday` (`integer [ 1 .. 31 ]`, required) - Example: eday=31 2-digit end day.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of flight records.                                                    | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ScheduleID` (`string`, optional) - Parent schedule identifier (hash string).
- `arrival_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `depart_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `public_notes` (`string or null`, optional)
- `reservation_type` (`string`, optional)
- `lesson_name` (`string or null`, optional)
- `course_name` (`string or null`, optional)
- `InstructorID` (`string or null`, optional)
- `AircraftID` (`string or null`, optional)
- `UserID` (`string`, optional)
- `CheckinID` (`string`, optional)
- `checkin_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `hobbs_in` (`string or null`, optional)
- `hobbs_out` (`string or null`, optional)
- `tach_in` (`string or null`, optional)
- `tach_out` (`string or null`, optional)
- `aircraft_charge` (`string or null`, optional)
- `aircraft_rate` (`string or null`, optional)
- `aircraft_rate_name` (`string or null`, optional)
- `instructor_flight_time` (`string or null`, optional)
- `instructor_flight_time_charge` (`string or null`, optional)
- `instructor_flight_rate` (`string or null`, optional)
- `instructor_ground_time` (`string or null`, optional)
- `instructor_ground_time_charge` (`string or null`, optional)
- `instructor_ground_rate` (`string or null`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ScheduleID": "string",
    "arrival_date": "2019-08-24T14:15:22Z",
    "depart_date": "2019-08-24T14:15:22Z",
    "public_notes": "string",
    "reservation_type": "Primary",
    "lesson_name": "string",
    "course_name": "string",
    "InstructorID": "string",
    "AircraftID": "string",
    "UserID": "string",
    "CheckinID": "string",
    "checkin_date": "2019-08-24T14:15:22Z",
    "hobbs_in": "string",
    "hobbs_out": "string",
    "tach_in": "string",
    "tach_out": "string",
    "aircraft_charge": "string",
    "aircraft_rate": "string",
    "aircraft_rate_name": "string",
    "instructor_flight_time": "string",
    "instructor_flight_time_charge": "string",
    "instructor_flight_rate": "string",
    "instructor_ground_time": "string",
    "instructor_ground_time_charge": "string",
    "instructor_ground_rate": "string"
  }
]
```

______________________________________________________________________

## Get next upcoming reservation for the FBO

**`GET`** `/user/schedule/next/{FboID}`

Returns the next reservation within the next 2 days for any user in the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of upcoming reservation records (may be empty).                       | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `AircraftID` (`string or null`, optional)
- `FboID` (`string`, optional)
- `ID` (`string`, optional) - Schedule identifier (hash string).
- `InstructorID` (`string or null`, optional)
- `UserID` (`string`, optional)
- `timezone_string` (`string`, optional)
- `arrival_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `depart_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `reservation_type` (`string`, optional)
- `pilot_name` (`string`, optional)
- `instructor_name` (`string or null`, optional)
- `pilot_name_share` (`string or null`, optional)
- `aircraft` (`string or null`, optional) - Full aircraft name including year.
- `preferred_name` (`string or null`, optional)
- `tail_number` (`string or null`, optional)
- `aircraft_status` (`string or null`, optional)
- `dispatched` (`string or null`, optional)
- `checkedin` (`string or null`, optional)
- `public_notes` (`string or null`, optional)
- `private_notes` (`string or null`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "AircraftID": "string",
    "FboID": "string",
    "ID": "string",
    "InstructorID": "string",
    "UserID": "string",
    "timezone_string": "America/New_York",
    "arrival_date": "2019-08-24T14:15:22Z",
    "depart_date": "2019-08-24T14:15:22Z",
    "reservation_type": "Primary",
    "pilot_name": "string",
    "instructor_name": "string",
    "pilot_name_share": "string",
    "aircraft": "string",
    "preferred_name": "string",
    "tail_number": "string",
    "aircraft_status": "string",
    "dispatched": "string",
    "checkedin": "string",
    "public_notes": "string",
    "private_notes": "string"
  }
]
```

______________________________________________________________________

## Get next upcoming reservation for a user

**`GET`** `/user/schedule/next/{FboID}/{UserID}`

Returns the next reservation within the next 2 days for the given user in the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `UserID` (`integer >= 1`, required) - User identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array containing the next reservation, or empty if none.                    | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `AircraftID` (`string or null`, optional)
- `FboID` (`string`, optional)
- `ID` (`string`, optional) - Schedule identifier (hash string).
- `InstructorID` (`string or null`, optional)
- `UserID` (`string`, optional)
- `timezone_string` (`string`, optional)
- `arrival_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `depart_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `reservation_type` (`string`, optional)
- `pilot_name` (`string`, optional)
- `instructor_name` (`string or null`, optional)
- `pilot_name_share` (`string or null`, optional)
- `aircraft` (`string or null`, optional) - Full aircraft name including year.
- `preferred_name` (`string or null`, optional)
- `tail_number` (`string or null`, optional)
- `aircraft_status` (`string or null`, optional)
- `dispatched` (`string or null`, optional)
- `checkedin` (`string or null`, optional)
- `public_notes` (`string or null`, optional)
- `private_notes` (`string or null`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "AircraftID": "string",
    "FboID": "string",
    "ID": "string",
    "InstructorID": "string",
    "UserID": "string",
    "timezone_string": "America/New_York",
    "arrival_date": "2019-08-24T14:15:22Z",
    "depart_date": "2019-08-24T14:15:22Z",
    "reservation_type": "Primary",
    "pilot_name": "string",
    "instructor_name": "string",
    "pilot_name_share": "string",
    "aircraft": "string",
    "preferred_name": "string",
    "tail_number": "string",
    "aircraft_status": "string",
    "dispatched": "string",
    "checkedin": "string",
    "public_notes": "string",
    "private_notes": "string"
  }
]
```

______________________________________________________________________

## List reservations for a user

**`GET`** `/user/schedules/{FboID}/{UserID}/{year}/{month}/{day}/{eyear}/{emonth}/{eday}`

Returns reservations for the given user within a date range.

UserID may be the literal string "all" to return schedules across all users for the FBO.

Date segments are optional from the right. The server supports truncated paths — you may omit trailing segments:

/user/schedules/{FboID}/{UserID} — returns today and tomorrow.
/user/schedules/{FboID}/{UserID}/{year} — returns today and tomorrow (year alone acts as the today/tomorrow shortcut).
/user/schedules/{FboID}/{UserID}/{year}/{month}/{day} — returns from that start date with no defined end.
Full path — returns the range from start to end date (inclusive).

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `UserID` (`integer >= 1`, required) - User identifier.
- `year` (`integer`, required) - Example: 2024 4-digit start year.
- `month` (`integer [ 1 .. 12 ]`, required) - Example: 6 2-digit start month.
- `day` (`integer [ 1 .. 31 ]`, required) - Example: 1 2-digit start day.
- `eyear` (`integer`, required) - Example: 2024 4-digit end year.
- `emonth` (`integer [ 1 .. 12 ]`, required) - Example: 6 2-digit end month.
- `eday` (`integer [ 1 .. 31 ]`, required) - Example: 30 2-digit end day.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of reservation records.                                               | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `AircraftID` (`string or null`, optional)
- `FboID` (`string`, optional)
- `ID` (`string`, optional) - Schedule identifier (hash string).
- `InstructorID` (`string or null`, optional)
- `UserID` (`string`, optional)
- `timezone_string` (`string`, optional)
- `arrival_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `depart_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `reservation_type` (`string`, optional)
- `pilot_name` (`string`, optional)
- `instructor_name` (`string or null`, optional)
- `pilot_name_share` (`string or null`, optional)
- `aircraft` (`string or null`, optional) - Full aircraft name including year.
- `preferred_name` (`string or null`, optional)
- `tail_number` (`string or null`, optional)
- `aircraft_status` (`string or null`, optional)
- `dispatched` (`string or null`, optional)
- `checkedin` (`string or null`, optional)
- `public_notes` (`string or null`, optional)
- `private_notes` (`string or null`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "AircraftID": "string",
    "FboID": "string",
    "ID": "string",
    "InstructorID": "string",
    "UserID": "string",
    "timezone_string": "America/New_York",
    "arrival_date": "2019-08-24T14:15:22Z",
    "depart_date": "2019-08-24T14:15:22Z",
    "reservation_type": "Primary",
    "pilot_name": "string",
    "instructor_name": "string",
    "pilot_name_share": "string",
    "aircraft": "string",
    "preferred_name": "string",
    "tail_number": "string",
    "aircraft_status": "string",
    "dispatched": "string",
    "checkedin": "string",
    "public_notes": "string",
    "private_notes": "string"
  }
]
```

______________________________________________________________________

# Cancellations

Cancelled reservation records.

## List cancelled reservations

**`GET`** `/cancellations/{FboID}`

Returns cancelled reservation records for the given FBO within the specified date range. The caller must have super admin role or be in a group with Cancellations report access.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Query Parameters

- `year` (`integer`, required) - Example: year=2024 4-digit start year.
- `month` (`integer [ 1 .. 12 ]`, required) - Example: month=1 2-digit start month.
- `day` (`integer [ 1 .. 31 ]`, required) - Example: day=1 2-digit start day.
- `eyear` (`integer`, required) - Example: eyear=2024 4-digit end year.
- `emonth` (`integer [ 1 .. 12 ]`, required) - Example: emonth=12 2-digit end month.
- `eday` (`integer [ 1 .. 31 ]`, required) - Example: eday=31 2-digit end day.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of cancellation records.                                              | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `cancelled_by` (`string`, optional) - Full name of the user who cancelled.
- `CancelledByID` (`integer`, optional)
- `cancelled_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `depart_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `return_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `UserID` (`integer`, optional)
- `ScheduleID` (`string`, optional) - Schedule identifier (hash string).
- `notice` (`string or null`, optional) - Human-readable notice period (e.g. "1 hour before").
- `public_notes` (`string or null`, optional)
- `cancellation_reason` (`string or null`, optional)
- `cancellation_notes` (`string or null`, optional)
- `resource` (`string or null`, optional) - Name of the resource (aircraft or other) that was booked.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "cancelled_by": "string",
    "CancelledByID": 0,
    "cancelled_date": "2019-08-24T14:15:22Z",
    "depart_date": "2019-08-24T14:15:22Z",
    "return_date": "2019-08-24T14:15:22Z",
    "UserID": 0,
    "ScheduleID": "string",
    "notice": "string",
    "public_notes": "string",
    "cancellation_reason": "string",
    "cancellation_notes": "string",
    "resource": "string"
  }
]
```

______________________________________________________________________

# Ledger

Ledger entries, store items, and adjustments.

## List ledger entries for a user

**`GET`** `/ledger/{FboID}/{UserID}`

Returns ledger entries for the given user within the specified date range. The caller must have admin role or be in a group with ledger read access.

Entries sharing the same InvoiceID belong to the same transaction. See LedgerItem for guidance on filtering payments vs. charges.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `UserID` (`integer >= 1`, required) - User identifier.

#### Query Parameters

- `year` (`integer`, required) - Example: year=2024 4-digit start year.
- `month` (`integer [ 1 .. 12 ]`, required) - Example: month=1 2-digit start month.
- `day` (`integer [ 1 .. 31 ]`, required) - Example: day=1 2-digit start day.
- `eyear` (`integer`, required) - Example: eyear=2024 4-digit end year.
- `emonth` (`integer [ 1 .. 12 ]`, required) - Example: emonth=12 2-digit end month.
- `eday` (`integer [ 1 .. 31 ]`, required) - Example: eday=31 2-digit end day.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of ledger entries.                                                    | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `InvoiceID` (`string`, optional) - Invoice identifier (numeric string or hash string).
- `entry_type` (`string`, optional) - Enum: "Payment" "Charge" "Adjustment"
- `entry_date` (`string <date-time> (IsoDateTime)`, optional) - ISO 8601 UTC date-time string, e.g. "2025-06-01T14:30:00Z".
- `description` (`string`, optional)
- `notes` (`string or null`, optional)
- `AircraftID` (`string or null`, optional)
- `receipt_link` (`string <uri>`, optional)
- `UserID` (`string`, optional)
- `user` (`string`, optional) - Full name of the user.
- `amount` (`string`, optional) - Total charge for this entry (quantity × unit price + taxes + global taxes).
- `adjustment_type` (`string or null`, optional) - Enum: "Credit" "Debit"
- `ItemID` (`string or null`, optional)
- `AdjustmentID` (`string or null`, optional) - Adjustment identifier (hash string).
- `item_quantity` (`string`, optional)
- `taxes` (`string`, optional) - Item-level tax amount.
- `taxes_object` (`Array of objects or null (TaxObject)`, optional)
- `global_taxes` (`string`, optional) - Global tax amount.
- `global_taxes_object` (`Array of objects or null (TaxObject)`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "InvoiceID": "string",
    "entry_type": "Payment",
    "entry_date": "2019-08-24T14:15:22Z",
    "description": "string",
    "notes": "string",
    "AircraftID": "string",
    "receipt_link": "http://example.com",
    "UserID": "string",
    "user": "string",
    "amount": "string",
    "adjustment_type": "Credit",
    "ItemID": "string",
    "AdjustmentID": "string",
    "item_quantity": "string",
    "taxes": "string",
    "taxes_object": [
      {
        "percentage": "string",
        "label": "string"
      }
    ],
    "global_taxes": "string",
    "global_taxes_object": [
      {
        "percentage": "string",
        "label": "string"
      }
    ]
  }
]
```

______________________________________________________________________

## List store items for an FBO

**`GET`** `/items/{FboID}`

Returns all store items (products/services) configured for the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of store items.                                                       | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional)
- `FboID` (`string`, optional)
- `name` (`string`, optional)
- `enabled` (`string`, optional) - Enum: "0" "1"
- `unit` (`string`, optional)
- `price` (`string`, optional)
- `brand` (`string or null`, optional)
- `category` (`string or null`, optional)
- `sort_order` (`string`, optional)
- `taxes` (`Array of objects (ItemStoreTax)`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "FboID": "string",
    "name": "string",
    "enabled": "0",
    "unit": "Each",
    "price": "string",
    "brand": "string",
    "category": "string",
    "sort_order": "string",
    "taxes": [
      {
        "taxable_percentage": "string",
        "taxable_agency": "string"
      }
    ]
  }
]
```

______________________________________________________________________

## List adjustments for an FBO

**`GET`** `/adjustments/{FboID}`

Returns all adjustment types (credits and debits) configured for the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of adjustment records.                                                | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional) - Adjustment identifier (hash string).
- `FboID` (`string`, optional)
- `name` (`string`, optional)
- `sign` (`string`, optional) - Enum: "Credit" "Debit"
- `amount` (`string or null`, optional)
- `percentage` (`string`, optional) - 1 if percentage-based, 0 if fixed amount.
- `enabled` (`string`, optional) - Enum: "0" "1"

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "FboID": "string",
    "name": "string",
    "sign": "Credit",
    "amount": "string",
    "percentage": "string",
    "enabled": "0"
  }
]
```

______________________________________________________________________

# Services

Services tracked definitions and log entries.

## List service types for an FBO

**`GET`** `/servicestracked/{FboID}`

Returns all services tracked definitions configured for the given FBO.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of service type definitions.                                          | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional) - Service type identifier (hash string).
- `label` (`string`, optional)
- `description` (`string or null`, optional)
- `sort_order` (`string`, optional)
- `required` (`string`, optional) - Enum: "Optional" "Suggested" "Required"
- `entry_type` (`string`, optional) - Enum: "Number" "Text" "Number (cumulative)" "Checkbox"
- `aircraft` (`Array of strings`, optional) - List of AircraftIDs this service applies to.

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "label": "string",
    "description": "string",
    "sort_order": "string",
    "required": "Optional",
    "entry_type": "Number",
    "aircraft": [
      "string"
    ]
  }
]
```

______________________________________________________________________

## Query services tracked log

**`GET`** `/servicestracked/log/{FboID}/{AircraftList}/{ServicesList}/{UsersList}/{year}/{month}/{day}/{eyear}/{emonth}/{eday}`

Returns service log entries matching the given filters and date range. All path parameters are required.

Use "all" for AircraftList, ServicesList, or UsersList to include all records for that dimension without filtering.

**Authorizations:**

- OAuth 2.0 (`oauth`)

#### Path Parameters

- `FboID` (`integer >= 1`, required) - FBO (organization) identifier.
- `AircraftList` (`string`, required) - Example: 1234,5678 Comma-separated list of AircraftIDs, or the literal string "all".
- `ServicesList` (`string`, required) - Example: all Comma-separated list of ServiceIDs, or the literal string "all".
- `UsersList` (`string`, required) - Example: all Comma-separated list of UserIDs, or the literal string "all".
- `year` (`integer`, required) - Example: 2024 4-digit start year.
- `month` (`integer [ 1 .. 12 ]`, required) - Example: 6 2-digit start month.
- `day` (`integer [ 1 .. 31 ]`, required) - Example: 1 2-digit start day.
- `eyear` (`integer`, required) - Example: 2024 4-digit end year.
- `emonth` (`integer [ 1 .. 12 ]`, required) - Example: 6 2-digit end month.
- `eday` (`integer [ 1 .. 31 ]`, required) - Example: 30 2-digit end day.

#### Responses

| Code    | Description                                                                 | Schema                     |
| :------ | :-------------------------------------------------------------------------- | :------------------------- |
| **200** | Array of service log entries.                                               | `application/json` (Array) |
| **403** | Not authorized. The authenticated user lacks permission for this operation. | `text/plain`               |
| **429** |                                                                             | —                          |

##### Response Schema (200)

**Content-Type:** `application/json`

**Type:** `Array`

- `ID` (`string`, optional) - Log entry identifier (hash string).
- `ServiceID` (`string`, optional) - Service type identifier.
- `label` (`string`, optional)
- `AircraftID` (`string`, optional)
- `tail_number` (`string`, optional)
- `UserID` (`string`, optional)
- `CustomerID` (`string`, optional)
- `User` (`string`, optional) - Full name of the user who logged the entry.
- `tracker_value` (`string or null`, optional)
- `total_tracker_value` (`string or null`, optional)
- `created` (`string`, optional) - Creation timestamp (YYYY-MM-DD HH:MM:SS).
- `hobbs` (`number or null`, optional)
- `tach` (`number or null`, optional)
- `tach2` (`number or null`, optional)
- `ttaf` (`number or null`, optional)

##### Response Schema (403)

**Content-Type:** `text/plain`

```text
string (ErrorPlainText)
Plain-text error message.
```

#### Response Samples

**Example: 200 / 403**

**Content-Type:** `application/json`

```json
[
  {
    "ID": "string",
    "ServiceID": "string",
    "label": "string",
    "AircraftID": "string",
    "tail_number": "string",
    "UserID": "string",
    "CustomerID": "string",
    "User": "string",
    "tracker_value": "string",
    "total_tracker_value": "string",
    "created": "string",
    "hobbs": 0,
    "tach": 0,
    "tach2": 0,
    "ttaf": 0
  }
]
```

______________________________________________________________________
