package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

var MongoClient *mongo.Client
var MongoDb *mongo.Database

// ConnectDB initializes the MongoDB connection
func ConnectDB(uri, dbName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Printf("Error connecting to MongoDB: %v\n", err)
		return err
	}

	// Ping the primary
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Printf("Error pinging MongoDB: %v\n", err)
		return err
	}

	MongoClient = client
	MongoDb = client.Database(dbName)
	log.Println("Connected to MongoDB!")
	return nil
}

// GetCollection returns a collection from the database
func GetCollection(collectionName string) *mongo.Collection {
	if MongoDb == nil {
		log.Println("MongoDB not connected. Call ConnectDB first.")
		return nil // Or handle error appropriately
	}
	return MongoDb.Collection(collectionName)
}

// DisconnectDB closes the MongoDB connection
func DisconnectDB() {
	if MongoClient == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := MongoClient.Disconnect(ctx); err != nil {
		log.Fatalf("Error disconnecting from MongoDB: %v", err)
	}
	log.Println("Disconnected from MongoDB.")
} 