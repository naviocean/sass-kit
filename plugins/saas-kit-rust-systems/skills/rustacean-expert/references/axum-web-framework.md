---
name: axum-web-framework
description: Complete guide for Axum web framework including routing, extractors, middleware, state management, error handling, and production deployment
tags: [axum, rust, web-framework, tokio, tower, async, rest-api]
tier: tier-1
---

# Axum Web Framework

A comprehensive skill for building production-ready web applications and APIs using Axum, the ergonomic and modular Rust web framework built on Tokio and Tower. Master routing, extractors, middleware, state management, error handling, and deployment patterns.

## When to Use This Skill

Use this skill when:

- Building REST APIs with Rust and async/await
- Creating high-performance web services with type safety
- Developing microservices with Tokio ecosystem integration
- Implementing WebSocket servers or Server-Sent Events (SSE)
- Building GraphQL APIs with Rust backend
- Creating middleware-heavy applications requiring Tower integration
- Developing production-ready web applications requiring robust error handling
- Building systems requiring fine-grained control over HTTP request/response handling
- Implementing authentication, authorization, and security middleware
- Creating real-time web applications with async Rust
- Developing APIs requiring request validation and transformation
- Building web services with complex routing and nested routers
- Implementing rate limiting, timeout, and backpressure handling
- Creating web applications requiring custom extractors and response types

## Core Concepts

### Axum Architecture Philosophy

Axum is built on three fundamental pillars:

1. **Tower Services**: Everything in Axum is built on Tower's `Service` trait, providing composability and middleware integration
2. **Type-Safe Extractors**: Request data extraction is compile-time checked, eliminating runtime parsing errors
3. **Minimal Boilerplate**: Ergonomic APIs that reduce ceremony while maintaining explicitness

### The Router

The `Router` is the central building block in Axum. It maps HTTP requests to handlers based on path and method.

**Key Properties:**
- Routes are matched in the order they're defined
- Routers can be nested for modular organization
- Middleware can be applied at router, route, or method level
- Generic over state type for flexible state management
- Implements Tower's `Service` trait for composability

**Router Creation:**
```rust
use axum::{Router, routing::get};

let app = Router::new()
    .route("/", get(handler))
    .route("/users/:id", get(get_user))
    .route("/posts", get(list_posts).post(create_post));
```

### Handlers

Handlers are async functions that process requests and return responses. Axum supports multiple handler signatures through its powerful type system.

**Handler Requirements:**
- Must be async functions
- Can extract data from requests using extractors
- Must return types implementing `IntoResponse`
- Can have up to 16 parameters (all must be extractors)

**Common Handler Patterns:**
```rust
// Simple handler
async fn handler() -> &'static str {
    "Hello, World!"
}

// Handler with path parameter
async fn get_user(Path(user_id): Path<u32>) -> String {
    format!("User ID: {}", user_id)
}

// Handler with multiple extractors
async fn create_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<User>, StatusCode> {
    // Implementation
}
```

### Extractors

Extractors are types that implement `FromRequest` or `FromRequestParts`, allowing type-safe extraction of data from requests.

**Built-in Extractors:**

1. **Path** - Extract path parameters
2. **Query** - Extract query string parameters
3. **Json** - Parse JSON request body
4. **Form** - Parse form-encoded request body
5. **State** - Access shared application state
6. **Extension** - Access request extensions
7. **Headers** - Access request headers
8. **Method** - Get HTTP method
9. **Uri** - Get request URI
10. **Request** - Get full request
11. **Bytes** - Raw request body as bytes
12. **String** - Request body as UTF-8 string
13. **Multipart** - Handle multipart/form-data

**Extractor Ordering:**
- Extractors that consume the request body must come last
- Multiple body extractors in one handler will cause compilation errors
- `State` and other non-body extractors can be in any order

### Responses

Any type implementing `IntoResponse` can be returned from handlers. Axum provides many built-in implementations.

**Built-in Response Types:**
- `String`, `&'static str` - Text responses
- `Json<T>` - JSON responses
- `Html<String>` - HTML responses
- `StatusCode` - Status-only responses
- `(StatusCode, T)` - Status with body
- `(Parts, T)` - Custom headers with body
- `Response` - Full control over response
- `Result<T, E>` - Error handling (where E: IntoResponse)

### State Management

Axum uses the `State` extractor to share data across handlers. State must implement `Clone` and is typically wrapped in `Arc` for shared ownership.

**State Patterns:**

1. **Simple State:**
```rust
#[derive(Clone)]
struct AppState {
    api_key: String,
}

let app = Router::new()
    .route("/", get(handler))
    .with_state(AppState {
        api_key: "secret".to_string(),
    });
```

2. **Shared State with Arc:**
```rust
#[derive(Clone)]
struct AppState {
    db_pool: Arc<DatabasePool>,
    cache: Arc<RwLock<Cache>>,
}
```

3. **Multiple State Types:**
```rust
// Define separate state types for different router sections
let api_router: Router<ApiState> = Router::new()
    .route("/api/data", get(api_handler));

let app_router: Router<AppState> = Router::new()
    .route("/app", get(app_handler));

// Combine with final state
let app = Router::new()
    .nest("/", app_router.with_state(app_state))
    .nest("/", api_router.with_state(api_state));
```

### Middleware

Middleware in Axum comes from Tower and provides request/response transformation, logging, authentication, and more.

**Middleware Categories:**

1. **Tower Middleware** - From `tower` and `tower-http` crates
2. **Custom Middleware** - Using `middleware::from_fn`
3. **Service Middleware** - Implementing Tower's `Service` trait
4. **Layer Pattern** - Using Tower's `Layer` for composability

**Middleware Application Order:**
- Applied with `.layer()` executes bottom-to-top (wrapping previous layers)
- Applied with `ServiceBuilder` executes top-to-bottom (more intuitive)
- Middleware on `Router::layer` runs after routing
- Middleware around `Router` (using `Layer::layer`) runs before routing

### Error Handling

Axum's error handling is built on the `IntoResponse` trait, allowing custom error types to be converted to HTTP responses.

**Error Handling Strategies:**

1. **Result Types:**
```rust
async fn handler() -> Result<Json<Data>, StatusCode> {
    // Returns 200 OK or error status code
}
```

2. **Custom Error Types:**
```rust
enum AppError {
    Database(sqlx::Error),
    NotFound,
    Unauthorized,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // Convert to HTTP response
    }
}
```

3. **HandleErrorLayer:**
```rust
use axum::error_handling::HandleErrorLayer;

let app = Router::new()
    .layer(
        ServiceBuilder::new()
            .layer(HandleErrorLayer::new(handle_error))
            .layer(TimeoutLayer::new(Duration::from_secs(30)))
    );
```

### Tower Integration

Axum is built on Tower, enabling powerful middleware composition and service abstraction.

**Key Tower Concepts:**

1. **Service Trait** - Asynchronous request processing
2. **Layer Trait** - Middleware factory pattern
3. **ServiceBuilder** - Ergonomic middleware composition
4. **Timeout** - Request timeout handling
5. **RateLimit** - Request rate limiting
6. **LoadShed** - Backpressure management
7. **Buffer** - Request buffering

## Deep Reference Guides

Load the targeted reference guide for implementation details and full code examples:

| Topic | Reference File |
|---|---|
| Routing, Path/Query/Json/Custom Extractors | [axum-web-framework/references/routing-and-extractors.md](axum-web-framework/references/routing-and-extractors.md) |
| Tower Middleware, `from_fn`, State Management | [axum-web-framework/references/middleware-and-state.md](axum-web-framework/references/middleware-and-state.md) |
| Error Handling, `IntoResponse`, Streaming & File Responses | [axum-web-framework/references/error-handling-and-responses.md](axum-web-framework/references/error-handling-and-responses.md) |
| Database, Config, Tracing, Graceful Shutdown, Testing & Patterns | [axum-web-framework/references/production-patterns-and-testing.md](axum-web-framework/references/production-patterns-and-testing.md) |
| Architectural Overview & Practical Examples | [README.md](axum-web-framework/README.md), [EXAMPLES.md](axum-web-framework/EXAMPLES.md) |
