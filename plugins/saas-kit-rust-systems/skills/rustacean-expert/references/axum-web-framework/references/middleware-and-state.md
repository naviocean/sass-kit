## Middleware

### Applying Middleware

**Three Ways to Apply Middleware:**

1. **Router-level** - Affects all routes
2. **Route-level** - Affects specific routes
3. **Method-level** - Affects specific methods on a route

```rust
use axum::{Router, routing::get, middleware};
use tower_http::trace::TraceLayer;

// 1. Router-level
let app = Router::new()
    .route("/", get(handler))
    .layer(TraceLayer::new_for_http());

// 2. Route-level
let app = Router::new()
    .route("/protected", get(handler))
    .route_layer(middleware::from_fn(auth_middleware));

// 3. Method-level
let app = Router::new()
    .route("/resource",
        get(handler)
            .route_layer(middleware::from_fn(read_only_auth))
            .post(create_handler)
            .route_layer(middleware::from_fn(write_auth))
    );
```

### Middleware Execution Order

**With sequential `.layer()` calls (bottom-to-top):**
```rust
let app = Router::new()
    .route("/", get(handler))
    .layer(layer_three)  // Executes third
    .layer(layer_two)    // Executes second
    .layer(layer_one);   // Executes first
```

**With `ServiceBuilder` (top-to-bottom):**
```rust
use tower::ServiceBuilder;

let app = Router::new()
    .route("/", get(handler))
    .layer(
        ServiceBuilder::new()
            .layer(layer_one)    // Executes first
            .layer(layer_two)    // Executes second
            .layer(layer_three)  // Executes third
    );
```

### Common Tower Middleware

**TraceLayer** - HTTP request tracing:
```rust
use tower_http::trace::TraceLayer;

let app = Router::new()
    .route("/", get(handler))
    .layer(TraceLayer::new_for_http());
```

**CompressionLayer** - Response compression:
```rust
use tower_http::compression::CompressionLayer;

let app = Router::new()
    .route("/", get(handler))
    .layer(CompressionLayer::new());
```

**CorsLayer** - CORS handling:
```rust
use tower_http::cors::{CorsLayer, Any};

let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any);

let app = Router::new()
    .route("/api/data", get(handler))
    .layer(cors);
```

**TimeoutLayer** - Request timeouts:
```rust
use tower::timeout::TimeoutLayer;
use std::time::Duration;

let app = Router::new()
    .route("/", get(handler))
    .layer(TimeoutLayer::new(Duration::from_secs(30)));
```

### HandleErrorLayer

Convert middleware errors to HTTP responses:

```rust
use axum::{
    error_handling::HandleErrorLayer,
    http::{StatusCode, Method, Uri},
    BoxError,
};
use tower::ServiceBuilder;
use std::time::Duration;

async fn handle_timeout_error(
    method: Method,
    uri: Uri,
    err: BoxError,
) -> (StatusCode, String) {
    if err.is::<tower::timeout::error::Elapsed>() {
        (
            StatusCode::REQUEST_TIMEOUT,
            format!("`{} {}` request timed out", method, uri),
        )
    } else {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("`{} {}` failed with {}", method, uri, err),
        )
    }
}

let app = Router::new()
    .route("/", get(handler))
    .layer(
        ServiceBuilder::new()
            .layer(HandleErrorLayer::new(handle_timeout_error))
            .layer(TimeoutLayer::new(Duration::from_secs(30)))
    );
```

### Custom Middleware with from_fn

Create custom middleware using async functions:

```rust
use axum::{
    middleware::{self, Next},
    extract::Request,
    response::Response,
    http::StatusCode,
};

async fn auth_middleware(
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok());

    if let Some(auth_header) = auth_header {
        if validate_token(auth_header).await {
            Ok(next.run(req).await)
        } else {
            Err(StatusCode::UNAUTHORIZED)
        }
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}

let app = Router::new()
    .route("/protected", get(handler))
    .layer(middleware::from_fn(auth_middleware));
```

**Passing data from middleware to handler:**
```rust
use axum::extract::Extension;

#[derive(Clone)]
struct CurrentUser {
    id: u32,
    username: String,
}

async fn auth_middleware(
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if let Some(user) = authorize_user(auth_header).await {
        req.extensions_mut().insert(user);
        Ok(next.run(req).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}

async fn handler(Extension(user): Extension<CurrentUser>) -> String {
    format!("Hello, {}", user.username)
}

let app = Router::new()
    .route("/", get(handler))
    .layer(middleware::from_fn(auth_middleware));
```

### Custom Tower Middleware

Implement Tower's `Service` and `Layer` traits for full control:

```rust
use tower::{Service, Layer};
use axum::{response::Response, extract::Request};
use std::task::{Context, Poll};
use futures_core::future::BoxFuture;

#[derive(Clone)]
struct MyLayer;

impl<S> Layer<S> for MyLayer {
    type Service = MyMiddleware<S>;

    fn layer(&self, inner: S) -> Self::Service {
        MyMiddleware { inner }
    }
}

#[derive(Clone)]
struct MyMiddleware<S> {
    inner: S,
}

impl<S> Service<Request> for MyMiddleware<S>
where
    S: Service<Request, Response = Response> + Send + 'static,
    S::Future: Send + 'static,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: Request) -> Self::Future {
        // Process request
        let future = self.inner.call(request);
        Box::pin(async move {
            let response: Response = future.await?;
            // Process response
            Ok(response)
        })
    }
}

let app = Router::new()
    .route("/", get(handler))
    .layer(MyLayer);
```

### Middleware with State Access

Create middleware that accesses application state:

```rust
use axum::extract::State;
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    db: Arc<Database>,
}

#[derive(Clone)]
struct MyLayer {
    state: AppState,
}

impl<S> Layer<S> for MyLayer {
    type Service = MyService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        MyService {
            inner,
            state: self.state.clone(),
        }
    }
}

#[derive(Clone)]
struct MyService<S> {
    inner: S,
    state: AppState,
}

impl<S> Service<Request> for MyService<S>
where
    S: Service<Request>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        // Use self.state here
        self.inner.call(req)
    }
}

let state = AppState {
    db: Arc::new(Database::new()),
};

let app = Router::new()
    .route("/", get(handler))
    .layer(MyLayer { state: state.clone() })
    .with_state(state);
```

### Middleware Before Routing

Apply middleware before routing (e.g., for URI rewriting):

```rust
use tower::Layer;
use axum::ServiceExt;

fn rewrite_request_uri(req: Request) -> Request {
    // Modify request URI
    req
}

let middleware = tower::util::MapRequestLayer::new(rewrite_request_uri);

let app = Router::new()
    .route("/", get(handler));

// Apply layer around entire router
let app_with_middleware = middleware.layer(app);

let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
axum::serve(listener, app_with_middleware.into_make_service()).await?;
```

## State Management

### Basic State

Simple state with cloneable types:

```rust
use axum::extract::State;

#[derive(Clone)]
struct AppState {
    config: Config,
    api_key: String,
}

async fn handler(State(state): State<AppState>) -> String {
    format!("Config: {:?}, Key: {}", state.config, state.api_key)
}

let state = AppState {
    config: Config::default(),
    api_key: "secret".to_string(),
};

let app = Router::new()
    .route("/", get(handler))
    .with_state(state);
```

### Shared State with Arc

Use `Arc` for shared ownership of expensive-to-clone types:

```rust
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
struct AppState {
    db_pool: Arc<DatabasePool>,
    cache: Arc<RwLock<HashMap<String, String>>>,
    config: Config, // Cheap to clone
}

async fn handler(State(state): State<AppState>) -> Result<String, StatusCode> {
    // Access database pool
    let conn = state.db_pool.get().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Access cache (read)
    let cache = state.cache.read().await;
    let value = cache.get("key");

    // Access cache (write)
    drop(cache); // Release read lock
    let mut cache = state.cache.write().await;
    cache.insert("new_key".to_string(), "value".to_string());

    Ok("Success".to_string())
}
```

### Multiple State Types

Use different state types for different router sections:

```rust
#[derive(Clone)]
struct ApiState {
    api_key: String,
}

#[derive(Clone)]
struct AppState {
    db: Arc<Database>,
}

fn api_routes() -> Router<ApiState> {
    Router::new()
        .route("/data", get(|State(state): State<ApiState>| async move {
            format!("API Key: {}", state.api_key)
        }))
}

fn app_routes() -> Router<AppState> {
    Router::new()
        .route("/users", get(|State(state): State<AppState>| async move {
            "Users".to_string()
        }))
}

let api_state = ApiState { api_key: "secret".to_string() };
let app_state = AppState { db: Arc::new(Database::new()) };

let app = Router::new()
    .nest("/api", api_routes().with_state(api_state))
    .nest("/app", app_routes().with_state(app_state));
```

### Generic State in Functions

Return routers with generic state for flexibility:

```rust
fn routes<S>() -> Router<S>
where
    S: Clone + Send + Sync + 'static,
{
    Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/version", get(|| async { "1.0.0" }))
}

// Can be combined with any state type
let app = Router::new()
    .merge(routes())
    .route("/", get(handler))
    .with_state(AppState { /* ... */ });
```

### State Transitions

Chain routers with different state requirements:

```rust
#[derive(Clone)]
struct StateA {
    data_a: String,
}

#[derive(Clone)]
struct StateB {
    data_b: String,
}

let router_a: Router<StateA> = Router::new()
    .route("/a", get(|State(s): State<StateA>| async move { s.data_a }));

// Provide StateA, next missing state is StateB
let router_b: Router<StateB> = router_a.with_state(StateA {
    data_a: "A".to_string(),
});

// Add routes needing StateB
let router_b = router_b
    .route("/b", get(|State(s): State<StateB>| async move { s.data_b }));

// Provide StateB, now we have Router<()>
let app: Router<()> = router_b.with_state(StateB {
    data_b: "B".to_string(),
});
```
