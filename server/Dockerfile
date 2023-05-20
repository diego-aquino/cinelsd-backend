FROM golang:1.20.4-alpine3.17 AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./src ./src

RUN CGO_ENABLED=0 GOOS=linux go build -o server ./src

FROM alpine:3.17 AS release

WORKDIR /app

COPY --from=build /app/server .

ENV GIN_MODE=release
EXPOSE $PORT

CMD ["./server"]
