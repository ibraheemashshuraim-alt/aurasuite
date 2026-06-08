package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	SupabaseURL      string
	SupabaseAnonKey  string
	SupabaseServiceKey string
	AgoraAppID       string
	AgoraCertificate string
	AIEngine         string // "openai" or "claude"
	AIAPIKey         string
}

func LoadConfig() *Config {
	// Load .env file if it exists, otherwise fall back to environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment variables")
	}

	return &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		AgoraAppID:         getEnv("AGORA_APP_ID", "placeholder_app_id"),
		AgoraCertificate:   getEnv("AGORA_APP_CERTIFICATE", "placeholder_certificate"),
		AIEngine:           getEnv("AI_ENGINE", "openai"),
		AIAPIKey:           getEnv("AI_API_KEY", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
