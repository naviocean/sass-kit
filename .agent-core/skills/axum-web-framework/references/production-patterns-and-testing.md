## Production Patterns

### Database Integration

Integrate with database pools:

```rust
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::sync::Arc;

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(&state.db)
        .await
        .map_err(AppError::Database)?
        .ok_or(AppError::NotFound)?;

    Ok(Json(user))
}

#[tokio::main]
async fn main() {
    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&env::var("DATABASE_URL").unwrap())
        .await
        .unwrap();

    let state = AppState { db };

    let app = Router::new()
        .route("/users/:id", get(get_user))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

### Configuration Management

Use environment variables and configuration:

```rust
use serde::Deserialize;
use config::{Config, ConfigError, Environment};

#[derive(Debug, Deserialize, Clone)]
struct Settings {
    database_url: String,
    redis_url: String,
    jwt_secret: String,
    port: u16,
}

impl Settings {
    fn new() -> Result<Self, ConfigError> {
        Config::builder()
            .add_source(Environment::default())
            .build()?
            .try_deserialize()
    }
}

#[derive(Clone)]
struct AppState {
    settings: Settings,
    db: PgPool,
}

#[tokio::main]
async fn main() {
    let settings = Settings::new().expect("Failed to load configuration");

    let db = PgPoolOptions::new()
        .connect(&settings.database_url)
        .await
        .expect("Failed to connect to database");

    let state = AppState {
        settings: settings.clone(),
        db,
    };

    let app = Router::new()
        .route("/", get(handler))
        .with_state(state);

    let addr = format!("0.0.0.0:{}", settings.port);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

### Structured Logging

Implement comprehensive logging:

```rust
use tracing::{info, error, debug, instrument};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting server");

    let app = Router::new()
        .route("/", get(handler))
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    info!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

#[instrument]
async fn handler(Path(id): Path<u32>) -> Result<String, AppError> {
    debug!("Handling request for user {}", id);

    match get_user_from_db(id).await {
        Ok(user) => {
            info!("Successfully retrieved user {}", id);
            Ok(format!("User: {}", user))
        }
        Err(e) => {
            error!("Failed to get user {}: {}", id, e);
            Err(AppError::Database(e))
        }
    }
}
```

### Graceful Shutdown

Implement graceful shutdown handling:

```rust
use tokio::signal;

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    println!("Signal received, starting graceful shutdown");
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(handler));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
}
```

### Health Checks

Implement health check endpoints:

```rust
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    database: String,
    cache: String,
}

async fn health_check(State(state): State<AppState>) -> Json<HealthResponse> {
    let db_status = match sqlx::query("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };

    let cache_status = match state.redis.ping().await {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };

    Json(HealthResponse {
        status: if db_status == "healthy" && cache_status == "healthy" {
            "healthy".to_string()
        } else {
            "degraded".to_string()
        },
        database: db_status.to_string(),
        cache: cache_status.to_string(),
    })
}

let app = Router::new()
    .route("/health", get(health_check))
    .route("/ready", get(readiness_check))
    .with_state(state);
```

### Rate Limiting

Implement rate limiting:

```rust
use tower::limit::RateLimitLayer;
use std::time::Duration;

let app = Router::new()
    .route("/api/data", get(handler))
    .layer(RateLimitLayer::new(
        100, // max requests
        Duration::from_secs(60), // per minute
    ));
```

### Request Validation

Validate requests with custom extractors:

```rust
use validator::{Validate, ValidationError};

#[derive(Debug, Deserialize, Validate)]
struct CreateUserRequest {
    #[validate(length(min = 3, max = 50))]
    username: String,
    #[validate(email)]
    email: String,
    #[validate(length(min = 8))]
    password: String,
}

struct ValidatedJson<T>(T);

#[async_trait]
impl<S, T> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(data) = Json::<T>::from_request(req, state)
            .await
            .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

        data.validate()
            .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

        Ok(ValidatedJson(data))
    }
}

async fn create_user(
    ValidatedJson(user): ValidatedJson<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    // user is validated
    Ok(Json(User { /* ... */ }))
}
```

## Testing

### Unit Testing Handlers

Test handlers in isolation:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_handler() {
        let app = Router::new().route("/", get(handler));

        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
```

### Integration Testing

Test full application:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode, Method};
    use tower::ServiceExt;
    use serde_json::json;

    #[tokio::test]
    async fn test_create_user() {
        let state = AppState::test();
        let app = create_app(state);

        let request_body = json!({
            "username": "testuser",
            "email": "test@example.com"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri("/users")
                    .header("content-type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap()
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::CREATED);
    }
}
```

## Best Practices

### Handler Organization

1. **Keep handlers thin** - Move business logic to service layer
2. **Use extractors** - Let type system handle extraction
3. **Return Result types** - Use custom error types
4. **Instrument handlers** - Add tracing for observability

### State Management

1. **Use Arc for expensive types** - Database pools, caches
2. **Keep state minimal** - Only what's truly shared
3. **Implement Clone** - Required for State extractor
4. **Avoid mutation** - Use interior mutability (RwLock, Mutex) when needed

### Error Handling

1. **Create custom error types** - Implement IntoResponse
2. **Provide context** - Include helpful error messages
3. **Log errors appropriately** - Use tracing
4. **Return proper status codes** - Match HTTP semantics

### Middleware

1. **Use ServiceBuilder** - More intuitive ordering
2. **Apply at right level** - Router vs route vs method
3. **Handle errors** - Use HandleErrorLayer for fallible middleware
4. **Keep middleware focused** - Single responsibility

### Performance

1. **Use connection pooling** - For databases and external services
2. **Enable compression** - CompressionLayer for responses
3. **Implement caching** - Reduce redundant operations
4. **Use backpressure** - LoadShedLayer, RateLimitLayer
5. **Optimize serialization** - Use efficient JSON libraries

### Security

1. **Validate inputs** - Use custom extractors with validation
2. **Implement authentication** - Use middleware for auth
3. **Use HTTPS** - In production environments
4. **Set security headers** - CORS, CSP, etc.
5. **Rate limit** - Prevent abuse

## Common Patterns

### Repository Pattern

```rust
trait UserRepository {
    async fn get(&self, id: u32) -> Result<User, AppError>;
    async fn create(&self, user: CreateUser) -> Result<User, AppError>;
    async fn update(&self, id: u32, user: UpdateUser) -> Result<User, AppError>;
    async fn delete(&self, id: u32) -> Result<(), AppError>;
}

struct PostgresUserRepository {
    pool: PgPool,
}

impl UserRepository for PostgresUserRepository {
    async fn get(&self, id: u32) -> Result<User, AppError> {
        // Implementation
    }
}

#[derive(Clone)]
struct AppState {
    user_repo: Arc<dyn UserRepository + Send + Sync>,
}

async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<u32>,
) -> Result<Json<User>, AppError> {
    let user = state.user_repo.get(id).await?;
    Ok(Json(user))
}
```

### Service Layer Pattern

```rust
struct UserService {
    repo: Arc<dyn UserRepository + Send + Sync>,
    email_service: Arc<EmailService>,
}

impl UserService {
    async fn create_user(&self, data: CreateUser) -> Result<User, AppError> {
        let user = self.repo.create(data).await?;
        self.email_service.send_welcome_email(&user).await?;
        Ok(user)
    }
}

#[derive(Clone)]
struct AppState {
    user_service: Arc<UserService>,
}
```

### Versioned APIs

```rust
fn v1_routes() -> Router<AppState> {
    Router::new()
        .route("/users", get(v1::list_users))
        .route("/users/:id", get(v1::get_user))
}

fn v2_routes() -> Router<AppState> {
    Router::new()
        .route("/users", get(v2::list_users))
        .route("/users/:id", get(v2::get_user))
}

let app = Router::new()
    .nest("/api/v1", v1_routes())
    .nest("/api/v2", v2_routes())
    .with_state(state);
```

---

**Skill Version**: 1.0.0
**Last Updated**: October 2025
**Skill Category**: Web Development, REST APIs, Rust, Async Programming
**Compatible With**: Axum 0.7+, Tokio 1.0+, Tower 0.4+
