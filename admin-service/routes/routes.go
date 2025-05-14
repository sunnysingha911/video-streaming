package routes

import (
	"admin-service/handlers"

	"github.com/gin-gonic/gin"
)

// SetupRoutes configures the routes for the application
func SetupRoutes(router *gin.Engine, userHandler *handlers.UserHandler, videoHandler *handlers.VideoHandler) {
	api := router.Group("/api/v1")
	{
		users := api.Group("/users")
		{
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
		}

		videos := api.Group("/videos")
		{
			videos.GET("/:id", videoHandler.GetVideo)
			videos.PUT("/:id", videoHandler.UpdateVideo)
			videos.DELETE("/:id", videoHandler.DeleteVideo)
		}
	}
}
