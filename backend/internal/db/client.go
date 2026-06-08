package db

import (
	"database/sql"
	"fmt"
	"log"

	"backend/internal/config"

	_ "github.com/lib/pq"
)

type Client struct {
	DB *sql.DB
}

func InitDB(cfg *config.Config) (*Client, error) {
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to Supabase PostgreSQL database!")
	return &Client{DB: db}, nil
}

func (c *Client) Close() {
	if c.DB != nil {
		c.DB.Close()
	}
}
