## Routing

### Basic Routing

Routes map HTTP methods and paths to handlers:

```rust
use axum::{
    Router,
    routing::{get, post, put, delete, patch},
};

let app = Router::new()
    .route("/", get(root))
    .route("/users", get(list_users).post(create_user))
    .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
    .route("/posts/:id/comments", get(get_comments).post(add_comment));
```

### Path Parameters

Extract dynamic segments from paths:

```rust
use axum::extract::Path;
use serde::Deserialize;

// Single parameter
async fn get_user(Path(user_id): Path<u32>) -> String {
    format!("User {}", user_id)
}

// Multiple parameters
#[derive(Deserialize)]
struct PostPath {
    user_id: u32,
    post_id: u32,
}

async fn get_post(Path(params): Path<PostPath>) -> String {
    format!("User {} Post {}", params.user_id, params.post_id)
}

// Using tuple for multiple params
async fn get_comment(
    Path((post_id, comment_id)): Path<(u32, u32)>
) -> String {
    format!("Post {} Comment {}", post_id, comment_id)
}
```

### Wildcard Routes

Capture remaining path segments:

```rust
// Captures all remaining path
async fn handler(Path(path): Path<String>) -> String {
    format!("Captured path: {}", path)
}

let app = Router::new()
    .route("/{*key}", get(handler));

// GET /foo/bar/baz -> path = "foo/bar/baz"
```

**Important:** Nested routers strip matched prefixes, but wildcard routes retain the full URI.

### Nested Routers

Organize routes into modules using router nesting:

```rust
use axum::{Router, routing::get};

fn api_routes() -> Router {
    Router::new()
        .route("/users", get(list_users))
        .route("/users/:id", get(get_user))
        .route("/posts", get(list_posts))
}

fn admin_routes() -> Router {
    Router::new()
        .route("/dashboard", get(dashboard))
        .route("/settings", get(settings))
}

let app = Router::new()
    .nest("/api", api_routes())
    .nest("/admin", admin_routes())
    .route("/", get(root));
```

**Nesting Behavior:**
- Matched prefix is stripped from URI before passing to nested router
- Handlers in nested routers only see path relative to nest point
- Fallback handlers are inherited from parent if not defined in child
- Middleware can be applied before or after nesting

### Fallback Handlers

Handle unmatched routes:

```rust
use axum::{http::StatusCode, handler::Handler};

async fn fallback() -> (StatusCode, &'static str) {
    (StatusCode::NOT_FOUND, "Not Found")
}

let app = Router::new()
    .route("/", get(handler))
    .fallback(fallback);
```

**Fallback Inheritance:**
```rust
async fn api_fallback() -> (StatusCode, &'static str) {
    (StatusCode::NOT_FOUND, "API endpoint not found")
}

let api = Router::new()
    .route("/users", get(list_users))
    .fallback(api_fallback);

let app = Router::new()
    .nest("/api", api)
    .fallback(fallback); // Used for non-/api routes
```

### Method Routing

Handle multiple HTTP methods on the same route:

```rust
use axum::routing::{get, post, MethodRouter};

// Multiple methods on one route
let app = Router::new()
    .route("/users", get(list_users).post(create_user));

// Different handlers per method
let app = Router::new()
    .route("/resource",
        get(get_resource)
            .post(create_resource)
            .put(update_resource)
            .delete(delete_resource)
            .patch(patch_resource)
    );
```

## Extractors Deep Dive

### Path Extractor

Extract typed path parameters:

```rust
use axum::extract::Path;
use serde::Deserialize;

// Simple extraction
async fn user_by_id(Path(id): Path<u32>) -> String {
    format!("User {}", id)
}

// Complex extraction
#[derive(Deserialize)]
struct Params {
    org: String,
    repo: String,
    issue: u32,
}

async fn github_issue(Path(params): Path<Params>) -> String {
    format!("{}/{} issue #{}", params.org, params.repo, params.issue)
}

let app = Router::new()
    .route("/users/:id", get(user_by_id))
    .route("/repos/:org/:repo/issues/:issue", get(github_issue));
```

### Query Extractor

Extract query string parameters:

```rust
use axum::extract::Query;
use serde::Deserialize;

#[derive(Deserialize)]
struct Pagination {
    page: Option<u32>,
    per_page: Option<u32>,
}

async fn list_users(Query(pagination): Query<Pagination>) -> String {
    let page = pagination.page.unwrap_or(1);
    let per_page = pagination.per_page.unwrap_or(20);
    format!("Page {} with {} items", page, per_page)
}

// GET /users?page=2&per_page=50
```

### Json Extractor

Parse JSON request bodies:

```rust
use axum::extract::Json;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct CreateUser {
    username: String,
    email: String,
}

#[derive(Serialize)]
struct User {
    id: u32,
    username: String,
    email: String,
}

async fn create_user(Json(payload): Json<CreateUser>) -> Json<User> {
    let user = User {
        id: 123,
        username: payload.username,
        email: payload.email,
    };
    Json(user)
}
```

**JSON Error Handling:**
```rust
use axum::extract::rejection::JsonRejection;
use axum::http::StatusCode;

async fn create_user(
    payload: Result<Json<CreateUser>, JsonRejection>
) -> Result<Json<User>, (StatusCode, String)> {
    match payload {
        Ok(Json(create_user)) => {
            // Valid JSON
            Ok(Json(User { /* ... */ }))
        }
        Err(JsonRejection::MissingJsonContentType(_)) => {
            Err((
                StatusCode::BAD_REQUEST,
                "Missing `Content-Type: application/json`".to_string(),
            ))
        }
        Err(JsonRejection::JsonDataError(err)) => {
            Err((
                StatusCode::BAD_REQUEST,
                format!("Invalid JSON: {}", err),
            ))
        }
        Err(JsonRejection::JsonSyntaxError(err)) => {
            Err((
                StatusCode::BAD_REQUEST,
                format!("JSON syntax error: {}", err),
            ))
        }
        Err(_) => {
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Unknown error".to_string(),
            ))
        }
    }
}
```

### State Extractor

Access shared application state:

```rust
use axum::extract::State;
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    db_pool: Arc<DatabasePool>,
    api_key: String,
}

async fn handler(State(state): State<AppState>) -> String {
    format!("API Key: {}", state.api_key)
}

let state = AppState {
    db_pool: Arc::new(DatabasePool::new()),
    api_key: "secret".to_string(),
};

let app = Router::new()
    .route("/", get(handler))
    .with_state(state);
```

### Extension Extractor

Access request extensions (useful for middleware):

```rust
use axum::extract::Extension;

#[derive(Clone)]
struct CurrentUser {
    id: u32,
    username: String,
}

async fn handler(Extension(user): Extension<CurrentUser>) -> String {
    format!("Hello, {}", user.username)
}

// Set by middleware:
async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let user = CurrentUser {
        id: 1,
        username: "alice".to_string(),
    };
    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}
```

### Form Extractor

Parse form-encoded request bodies:

```rust
use axum::extract::Form;
use serde::Deserialize;

#[derive(Deserialize)]
struct LoginForm {
    username: String,
    password: String,
}

async fn login(Form(form): Form<LoginForm>) -> String {
    format!("Logging in user: {}", form.username)
}
```

### Headers Extractor

Access request headers:

```rust
use axum::http::HeaderMap;

async fn handler(headers: HeaderMap) -> String {
    let user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown");
    format!("User-Agent: {}", user_agent)
}
```

### Custom Extractors

Create custom extractors by implementing `FromRequest` or `FromRequestParts`:

```rust
use axum::{
    extract::{FromRequest, Request},
    response::{IntoResponse, Response},
    http::StatusCode,
    async_trait,
};

struct AuthenticatedUser {
    id: u32,
    username: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        // Extract and validate auth token
        let auth_header = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| {
                (StatusCode::UNAUTHORIZED, "Missing authorization header")
                    .into_response()
            })?;

        // Validate token and return user
        Ok(AuthenticatedUser {
            id: 1,
            username: "alice".to_string(),
        })
    }
}

async fn protected_route(user: AuthenticatedUser) -> String {
    format!("Hello, {}", user.username)
}
```
