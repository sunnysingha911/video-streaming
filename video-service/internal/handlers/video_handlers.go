package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"video-service/internal/db"
	"video-service/internal/models"
)

// CreateVideo godoc
// @Summary Create a new video record
// @Description Creates a new video metadata record in the database. Actual video file upload is a separate step.
// @Tags videos
// @Accept  json
// @Produce  json
// @Param   video  body   models.Video  true  "Video metadata"
// @Success 201 {object} models.Video
// @Failure 400 {object} map[string]string "Invalid request payload"
// @Failure 500 {object} map[string]string "Error creating video"
// @Router /admin/videos [post]
func CreateVideo(c *gin.Context) {
	var video models.Video
	if err := c.ShouldBindJSON(&video); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	video.ID = primitive.NewObjectID()
	video.UploadedAt = time.Now()
	video.UpdatedAt = time.Now()
	video.Status = "pending_upload" // Initial status

	// For now, UploaderID will be a placeholder. In a real app, this would come from auth middleware.
	video.UploaderID = "admin_placeholder_id"

	collection := db.GetCollection("videos")
	_, err := collection.InsertOne(c.Request.Context(), video)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create video: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, video)
}

// GetVideoByID godoc
// @Summary Get a single video by ID
// @Description Retrieves video metadata for a given video ID. Admin access.
// @Tags videos
// @Produce  json
// @Param   id   path   string  true  "Video ID"
// @Success 200 {object} models.Video
// @Failure 400 {object} map[string]string "Invalid video ID format"
// @Failure 404 {object} map[string]string "Video not found"
// @Failure 500 {object} map[string]string "Error fetching video"
// @Router /admin/videos/{id} [get]
func GetVideoByID(c *gin.Context) {
	videoIDHex := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(videoIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID format"})
		return
	}

	var video models.Video
	collection := db.GetCollection("videos")

	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&video)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, video)
}

// UpdateVideo godoc
// @Summary Update an existing video
// @Description Updates the metadata of an existing video. Admin access.
// @Tags videos
// @Accept  json
// @Produce  json
// @Param   id   path   string  true  "Video ID"
// @Param   video  body   models.Video  true  "Video metadata to update"
// @Success 200 {object} models.Video
// @Failure 400 {object} map[string]string "Invalid request payload or video ID format"
// @Failure 404 {object} map[string]string "Video not found"
// @Failure 500 {object} map[string]string "Error updating video"
// @Router /admin/videos/{id} [put]
func UpdateVideo(c *gin.Context) {
	videoIDHex := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(videoIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID format"})
		return
	}

	var updates models.Video
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	updates.UpdatedAt = time.Now()

	// Construct the update document. We use bson.M to allow partial updates.
	// We explicitly exclude ID, UploadedAt, and UploaderID from being changed via this endpoint.
	updateFields := bson.M{
		"$set": bson.M{
			"title":       updates.Title,
			"description": updates.Description,
			// s3_key and manifest_url might be updated by a different process (transcoding)
			// "s3_key": updates.S3Key,
			// "manifest_url": updates.ManifestURL,
			"thumbnail_url": updates.ThumbnailURL,
			"preview_url":   updates.PreviewURL,
			"duration":      updates.Duration,
			"categories":    updates.Categories,
			"tags":          updates.Tags,
			"status":        updates.Status,
			"updated_at":    updates.UpdatedAt,
		},
	}

	collection := db.GetCollection("videos")
	result, err := collection.UpdateOne(c.Request.Context(), bson.M{"_id": objectID}, updateFields)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update video: " + err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	// Fetch the updated document to return it
	var updatedVideo models.Video
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&updatedVideo)
	if err != nil {
		// This should ideally not happen if UpdateOne was successful and MatchedCount > 0
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated video: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedVideo)
}

// DeleteVideo godoc
// @Summary Delete a video by ID
// @Description Deletes a video and its associated metadata. Admin access.
// @Tags videos
// @Produce  json
// @Param   id   path   string  true  "Video ID"
// @Success 200 {object} map[string]string "Success message"
// @Failure 400 {object} map[string]string "Invalid video ID format"
// @Failure 404 {object} map[string]string "Video not found"
// @Failure 500 {object} map[string]string "Error deleting video"
// @Router /admin/videos/{id} [delete]
func DeleteVideo(c *gin.Context) {
	videoIDHex := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(videoIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID format"})
		return
	}

	collection := db.GetCollection("videos")
	result, err := collection.DeleteOne(c.Request.Context(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete video: " + err.Error()})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	// TODO: Add logic here to delete the actual video files from S3/Cloudinary
	// This is crucial to avoid orphaned files.

	c.JSON(http.StatusOK, gin.H{"message": "Video deleted successfully"})
}

// ListVideos godoc
// @Summary List all videos (admin)
// @Description Retrieves a paginated list of all videos. Admin access.
// @Tags videos
// @Produce  json
// @Param   page  query   int  false  "Page number" default(1)
// @Param   limit query   int  false  "Items per page" default(10)
// @Success 200 {array} models.Video
// @Failure 500 {object} map[string]string "Error fetching videos"
// @Router /admin/videos [get]
func ListVideos(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	skip := (page - 1) * limit

	var videos []models.Video
	collection := db.GetCollection("videos")

	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	// Optionally, add sorting, e.g., by upload date descending
	// findOptions.SetSort(bson.D{{"uploaded_at", -1}})

	cursor, err := collection.Find(c.Request.Context(), bson.M{}, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch videos: " + err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	if err = cursor.All(c.Request.Context(), &videos); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode videos: " + err.Error()})
		return
	}

	if videos == nil { // Ensure we return an empty array instead of null if no videos found
		videos = []models.Video{}
	}

	c.JSON(http.StatusOK, videos)
}

// GetVideoByIDForUser godoc
// @Summary Get a single video by ID for users
// @Description Retrieves video metadata for a given video ID. Only returns videos with status "ready".
// @Tags videos
// @Produce  json
// @Param   id   path   string  true  "Video ID"
// @Success 200 {object} models.Video
// @Failure 400 {object} map[string]string "Invalid video ID format"
// @Failure 404 {object} map[string]string "Video not found or not ready"
// @Failure 500 {object} map[string]string "Error fetching video"
// @Router /videos/{id} [get]
func GetVideoByIDForUser(c *gin.Context) {
	videoIDHex := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(videoIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid video ID format"})
		return
	}

	var video models.Video
	collection := db.GetCollection("videos")

	// Only return videos with status "ready"
	err = collection.FindOne(c.Request.Context(), bson.M{
		"_id":    objectID,
		"status": "ready",
	}).Decode(&video)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Video not found or not available"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch video: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, video)
}

// ListVideosForUser godoc
// @Summary List available videos for users
// @Description Retrieves a paginated list of videos with status "ready".
// @Tags videos
// @Produce  json
// @Param   page  query   int  false  "Page number" default(1)
// @Param   limit query   int  false  "Items per page" default(10)
// @Success 200 {array} models.Video
// @Failure 500 {object} map[string]string "Error fetching videos"
// @Router /videos [get]
func ListVideosForUser(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	skip := (page - 1) * limit

	var videos []models.Video
	collection := db.GetCollection("videos")

	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.D{{"uploaded_at", -1}})

	// Only fetch videos marked as "ready"
	cursor, err := collection.Find(c.Request.Context(), bson.M{
		"status": "ready",
	}, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch videos: " + err.Error()})
		return
	}
	defer cursor.Close(c.Request.Context())

	if err = cursor.All(c.Request.Context(), &videos); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode videos: " + err.Error()})
		return
	}

	if videos == nil {
		videos = []models.Video{}
	}

	c.JSON(http.StatusOK, videos)
}
