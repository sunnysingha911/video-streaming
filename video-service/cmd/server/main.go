package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"video-service/internal/db"
	"video-service/internal/handlers"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default environment variables")
	}

	mongoDBURI := os.Getenv("MONGO_DB_URI")
	mongoDBName := os.Getenv("MONGO_DB_NAME")
	serverAddress := os.Getenv("SERVER_ADDRESS")

	// Initialize MongoDB connection
	if err := db.ConnectDB(mongoDBURI, mongoDBName); err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer db.DisconnectDB() // Ensure disconnection on shutdown

	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// Admin routes
	adminRoutes := r.Group("/admin")
	{
		adminRoutes.POST("/videos", handlers.CreateVideo)
		adminRoutes.GET("/videos/:id", handlers.GetVideoByID)
		adminRoutes.PUT("/videos/:id", handlers.UpdateVideo)
		adminRoutes.DELETE("/videos/:id", handlers.DeleteVideo)
		adminRoutes.GET("/videos", handlers.ListVideos)
	}

	// Start server
	log.Printf("Server starting on %s", serverAddress)
	if err := r.Run(serverAddress); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
