package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func loadEnv() {
	envFile := ".env"

	_, err := os.Stat(envFile)
	if err != nil {
		return
	}

	err = godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}

func createRedisClients() (*redis.Client, *redis.Client, *redis.Client) {
	redisAddress := os.Getenv("REDIS_HOST") + ":" + os.Getenv("REDIS_PORT")
	redisPassword := os.Getenv("REDIS_PASSWORD")

	redisMovieDatabase, _ := strconv.Atoi(os.Getenv("REDIS_MOVIE_DATABASE"))
	redisMovieMainActorsDatabase, _ := strconv.Atoi(os.Getenv("REDIS_MOVIE_MAIN_ACTORS_DATABASE"))
	redisActorDatabase, _ := strconv.Atoi(os.Getenv("REDIS_ACTOR_DATABASE"))

	movieClient := redis.NewClient(&redis.Options{
		Addr:     redisAddress,
		Password: redisPassword,
		DB:       redisMovieDatabase,
	})

	movieMainActorClient := redis.NewClient(&redis.Options{
		Addr:     redisAddress,
		Password: redisPassword,
		DB:       redisMovieMainActorsDatabase,
	})

	actorClient := redis.NewClient(&redis.Options{
		Addr:     redisAddress,
		Password: redisPassword,
		DB:       redisActorDatabase,
	})

	return movieClient, movieMainActorClient, actorClient
}

func sendStringifiedEntity(stringifiedEntity string, context *gin.Context) {
	if len(stringifiedEntity) > 0 {
		context.Writer.Header().Set("Content-Type", "application/json")
		context.String(http.StatusOK, stringifiedEntity)
	} else {
		context.JSON(http.StatusOK, nil)
	}
}

func main() {
	loadEnv()

	server := gin.Default()
	mainContext := context.Background()
	movieClient, movieMainActorClient, actorClient := createRedisClients()

	server.GET("/movies/:movieId", func(context *gin.Context) {
		movieId := context.Param("movieId")
		stringifiedMovie, _ := movieClient.Get(mainContext, movieId).Result()
		sendStringifiedEntity(stringifiedMovie, context)
	})

	server.GET("/movie-main-actors/:movieId", func(context *gin.Context) {
		movieId := context.Param("movieId")
		stringifiedMovieMainActors, _ := movieMainActorClient.Get(mainContext, movieId).Result()
		sendStringifiedEntity(stringifiedMovieMainActors, context)
	})

	server.GET("/actors/:actorId", func(context *gin.Context) {
		actorId := context.Param("actorId")
		stringifiedActor, _ := actorClient.Get(mainContext, actorId).Result()
		sendStringifiedEntity(stringifiedActor, context)
	})

	port := os.Getenv("PORT")
	server.Run(":" + port)
}
