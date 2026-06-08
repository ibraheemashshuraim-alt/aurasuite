package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/internal/config"
	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/services"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
)

func main() {
	log.Println("Starting AuraSuite API Backend...")

	// 1. Load configurations
	cfg := config.LoadConfig()

	// 2. Initialize Database Client
	database, err := db.InitDB(cfg)
	if err != nil {
		log.Printf("Warning: Database connection failed: %v. Server running in mock/isolated mode.", err)
	} else {
		defer database.Close()
	}

	// 3. Initialize Services
	aiService := services.NewAIService(cfg)
	agoraService := services.NewAgoraService(cfg)

	// 4. Initialize Handlers and Servers
	server := handlers.NewServer(database, aiService, agoraService)
	authMiddleware := middleware.NewAuthMiddleware(cfg, database)

	// 5. Setup Router (Chi Router)
	r := chi.NewRouter()

	// Global Middleware
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.Timeout(60 * time.Second))

	// CORS Middleware (simple version)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	// Public Routes
	r.Get("/health", server.HealthCheck)

	// Protected Routes (Required Authentication)
	r.Route("/api", func(r chi.Router) {
		r.Use(authMiddleware.RequireAuth)

		r.Post("/onboarding", server.Onboarding)
		r.Post("/tasks/suggest-payout", server.SuggestPayout)
		r.Post("/meetings/token", server.GenerateAgoraToken)
		r.Post("/meetings/lock-chat", server.LockMeetingChat)
	})

	// 6. Graceful Shutdown & Server Startup
	httpServer := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("AuraSuite Server is listening on port %s", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
