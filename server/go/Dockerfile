FROM golang:1.21.1-alpine3.18 AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./src ./src
RUN CGO_ENABLED=0 GOOS=linux go build -gcflags '-l=4' -o server ./src

FROM alpine:3.18 AS release

WORKDIR /app

COPY --from=build /app/server ./

ENV GIN_MODE=release
EXPOSE $PORT

CMD ["./server"]
