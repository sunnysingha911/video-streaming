package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Video represents the video document in MongoDB
type Video struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description" json:"description"`
	S3Key       string             `bson:"s3_key" json:"s3_key"`                 // Key for the original video in S3
	ManifestURL string             `bson:"manifest_url" json:"manifest_url"`       // URL for the HLS/DASH manifest
	ThumbnailURL string            `bson:"thumbnail_url" json:"thumbnail_url"`
	PreviewURL  string             `bson:"preview_url" json:"preview_url"`
	Duration    float64            `bson:"duration" json:"duration"`             // Duration in seconds
	Categories  []primitive.ObjectID `bson:"categories" json:"categories"`
	Tags        []primitive.ObjectID `bson:"tags" json:"tags"`
	UploadedAt  time.Time          `bson:"uploaded_at" json:"uploaded_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
	Status      string             `bson:"status" json:"status"`                 // e.g., "uploading", "processing", "ready", "error"
	UploaderID  string             `bson:"uploader_id" json:"uploader_id"`       // ID of the admin who uploaded
}

// Category represents the category document in MongoDB
type Category struct {
	ID   primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name string             `bson:"name" json:"name"`
}

// Tag represents the tag document in MongoDB
type Tag struct {
	ID   primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name string             `bson:"name" json:"name"`
}

// View represents a view record for a video
type View struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	VideoID   primitive.ObjectID `bson:"video_id" json:"video_id"`
	UserID    string             `bson:"user_id" json:"user_id"` // ID of the user who viewed
	ViewedAt  time.Time          `bson:"viewed_at" json:"viewed_at"`
	WatchTime float64            `bson:"watch_time" json:"watch_time"` // How much of the video was watched in seconds
} 