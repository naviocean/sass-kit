## Error Handling

### Basic Error Handling with Result

Use `Result` to handle errors in handlers:

```rust
use axum::http::StatusCode;

async fn handler() -> Result<String, StatusCode> {
    let result = some_operation().await;
    match result {
        Ok(data) => Ok(format!("Success: {}", data)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
```

### Custom Error Types

Implement `IntoResponse` for custom errors:

```rust
use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use serde::Serialize;

#[derive(Debug)]
enum AppError {
    Database(sqlx::Error),
    NotFound,
    Unauthorized,
    ValidationError(String),
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(e) => {
                tracing::error!("Database error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
            }
            AppError::NotFound => (StatusCode::NOT_FOUND, "Resource not found"),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::ValidationError(msg) => (StatusCode::BAD_REQUEST, &msg),
        };

        let body = Json(ErrorResponse {
            error: status.to_string(),
            message: error_message.to_string(),
        });

        (status, body).into_response()
    }
}

// Use in handler
async fn get_user(Path(id): Path<u32>) -> Result<Json<User>, AppError> {
    let user = db.get_user(id).await.map_err(AppError::Database)?;
    user.ok_or(AppError::NotFound).map(Json)
}
```

### Extractor Rejection Handling

Handle extractor rejections for better error messages:

```rust
use axum::extract::rejection::JsonRejection;

async fn create_user(
    payload: Result<Json<CreateUser>, JsonRejection>,
) -> Result<Json<User>, AppError> {
    let Json(create_user) = payload.map_err(|err| match err {
        JsonRejection::MissingJsonContentType(_) => {
            AppError::ValidationError("Content-Type must be application/json".to_string())
        }
        JsonRejection::JsonDataError(e) => {
            AppError::ValidationError(format!("Invalid JSON: {}", e))
        }
        JsonRejection::JsonSyntaxError(e) => {
            AppError::ValidationError(format!("JSON syntax error: {}", e))
        }
        _ => AppError::ValidationError("Invalid request body".to_string()),
    })?;

    // Process create_user
    Ok(Json(user))
}
```

### Custom Extractors with Error Handling

Create extractors with custom rejection types:

```rust
use axum::{
    extract::{FromRequest, Request},
    response::{IntoResponse, Response},
    async_trait,
};

struct ValidatedJson<T>(T);

#[async_trait]
impl<S, T> FromRequest<S> for ValidatedJson<T>
where
    T: serde::de::DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(data) = Json::<T>::from_request(req, state)
            .await
            .map_err(|err| {
                (
                    StatusCode::BAD_REQUEST,
                    format!("Invalid JSON: {}", err),
                ).into_response()
            })?;

        data.validate().map_err(|err| {
            (
                StatusCode::BAD_REQUEST,
                format!("Validation error: {}", err),
            ).into_response()
        })?;

        Ok(ValidatedJson(data))
    }
}

async fn handler(ValidatedJson(data): ValidatedJson<MyData>) -> String {
    // data is validated
    format!("Received: {:?}", data)
}
```

### Middleware Error Handling

Handle errors from fallible middleware:

```rust
use axum::error_handling::HandleErrorLayer;
use tower::ServiceBuilder;

async fn handle_timeout_error(err: BoxError) -> (StatusCode, String) {
    if err.is::<tower::timeout::error::Elapsed>() {
        (
            StatusCode::REQUEST_TIMEOUT,
            "Request took too long".to_string(),
        )
    } else {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Unhandled error: {}", err),
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

### Fallible Services

Route to services that can fail:

```rust
use axum::error_handling::HandleError;

async fn fallible_operation() -> Result<(), anyhow::Error> {
    // Operation that might fail
    Ok(())
}

let fallible_service = tower::service_fn(|_req| async {
    fallible_operation().await?;
    Ok::<_, anyhow::Error>(Response::new(Body::empty()))
});

async fn handle_error(err: anyhow::Error) -> (StatusCode, String) {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        format!("Something went wrong: {}", err),
    )
}

let app = Router::new().route_service(
    "/",
    HandleError::new(fallible_service, handle_error),
);
```

## Response Building

### JSON Responses

Return JSON with type safety:

```rust
use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
struct ApiResponse {
    success: bool,
    data: String,
}

async fn handler() -> Json<ApiResponse> {
    Json(ApiResponse {
        success: true,
        data: "Hello".to_string(),
    })
}
```

### HTML Responses

Serve HTML content:

```rust
use axum::response::Html;

async fn handler() -> Html<&'static str> {
    Html("<h1>Hello, World!</h1>")
}

async fn dynamic_html(Path(name): Path<String>) -> Html<String> {
    Html(format!("<h1>Hello, {}</h1>", name))
}
```

### Status Code Responses

Return different status codes:

```rust
use axum::http::StatusCode;

async fn handler() -> StatusCode {
    StatusCode::NO_CONTENT
}

async fn with_body() -> (StatusCode, String) {
    (StatusCode::CREATED, "Resource created".to_string())
}

async fn json_with_status() -> (StatusCode, Json<ApiResponse>) {
    (StatusCode::CREATED, Json(ApiResponse { /* ... */ }))
}
```

### Custom Headers

Add custom headers to responses:

```rust
use axum::http::{HeaderMap, header};

async fn handler() -> (HeaderMap, String) {
    let mut headers = HeaderMap::new();
    headers.insert(header::CACHE_CONTROL, "max-age=3600".parse().unwrap());
    headers.insert("X-Custom-Header", "value".parse().unwrap());
    (headers, "Response body".to_string())
}
```

### Full Response Control

Build complete responses:

```rust
use axum::{
    response::Response,
    http::{StatusCode, header},
    body::Body,
};

async fn handler() -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Custom", "value")
        .body(Body::from(r#"{"status":"ok"}"#))
        .unwrap()
}
```

### Streaming Responses

Stream data to clients:

```rust
use axum::response::sse::{Event, Sse};
use futures::stream::{self, Stream};
use std::convert::Infallible;

async fn sse_handler() -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = stream::iter(0..10).map(|i| {
        Ok(Event::default().data(format!("Event {}", i)))
    });
    Sse::new(stream)
}
```

### File Downloads

Serve files for download:

```rust
use axum::{
    response::{Response, IntoResponse},
    http::{header, StatusCode},
    body::Body,
};
use tokio::fs::File;

async fn download_file() -> Result<Response, StatusCode> {
    let file = File::open("path/to/file.pdf")
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let body = Body::from_stream(tokio_util::io::ReaderStream::new(file));

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/pdf")
        .header(
            header::CONTENT_DISPOSITION,
            "attachment; filename=\"file.pdf\"",
        )
        .body(body)
        .unwrap())
}
```
