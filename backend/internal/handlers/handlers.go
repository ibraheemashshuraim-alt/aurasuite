package handlers

import (
	"encoding/json"
	"net/http"

	"backend/internal/db"
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services"
)

type Server struct {
	db    *db.Client
	ai    *services.AIService
	agora *services.AgoraService
}

func NewServer(database *db.Client, aiService *services.AIService, agoraService *services.AgoraService) *Server {
	return &Server{
		db:    database,
		ai:    aiService,
		agora: agoraService,
	}
}

// Health Check
func (s *Server) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy", "service": "AuraSuite Backend"})
}

// 1. AI-Powered Onboarding Handler
type OnboardingRequest struct {
	FullName string   `json:"full_name"`
	Skills   []string `json:"skills"`
	Bio      string   `json:"bio"`
}

func (s *Server) Onboarding(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized profile context", http.StatusUnauthorized)
		return
	}

	var req OnboardingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// 1. Run AI Smart Allocation
	allocation, err := s.ai.CategorizeProfile(req.FullName, req.Skills, req.Bio)
	if err != nil {
		http.Error(w, "AI profiling failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 2. Save/Update Profile in Supabase
	_, err = s.db.DB.Exec(`
		INSERT INTO profiles (id, organization_id, email, full_name, role, category, domain, skills)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			full_name = EXCLUDED.full_name,
			category = EXCLUDED.category,
			domain = EXCLUDED.domain,
			skills = EXCLUDED.skills
	`, user.ID, user.OrganizationID, user.Email, req.FullName, user.Role, allocation.Category, allocation.Domain, req.Skills)

	if err != nil {
		http.Error(w, "Failed to update profile: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"message":  "AI Onboarding completed successfully",
		"category": allocation.Category,
		"domain":   allocation.Domain,
		"skills":   allocation.Skills,
	})
}

// 2. AI Budget Suggestion Handler
type PayoutRequest struct {
	TaskID      string `json:"task_id"`
	Complexity  string `json:"complexity"`
	HoursSpent  int    `json:"hours_spent"`
}

func (s *Server) SuggestPayout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	user := middleware.GetUserFromContext(r.Context())
	if user == nil || user.Role != models.RoleAdmin {
		http.Error(w, "Admin access required", http.StatusForbidden)
		return
	}

	var req PayoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Fetch task details to enrich AI prompt
	var title, desc string
	err := s.db.DB.QueryRow("SELECT title, description FROM tasks WHERE id = $1", req.TaskID).Scan(&title, &desc)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	// Calculate suggested payout using AI Engine
	suggestion, err := s.ai.EstimateBudget(title, desc, req.Complexity, req.HoursSpent)
	if err != nil {
		http.Error(w, "AI budget estimation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update task with suggestions in Supabase
	_, err = s.db.DB.Exec(`
		UPDATE tasks
		SET complexity = $1, hours_spent = $2, suggested_payout = $3
		WHERE id = $4
	`, req.Complexity, req.HoursSpent, suggestion.SuggestedPayout, req.TaskID)

	if err != nil {
		http.Error(w, "Failed to save budget suggestion", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":          true,
		"suggested_payout": suggestion.SuggestedPayout,
		"explanation":      suggestion.Explanation,
	})
}

// 3. Agora Meeting Token Handler
type TokenRequest struct {
	ChannelName string `json:"channel_name"`
	UID         uint32 `json:"uid"`
}

func (s *Server) GenerateAgoraToken(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized context", http.StatusUnauthorized)
		return
	}

	var req TokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Determine client channel privilege role
	role := "publisher" // default
	if user.Role == models.RoleAdmin || user.Domain == "Teacher" {
		role = "subscriber_and_publisher" // special token roles can be resolved if needed
	}

	token, err := s.agora.GenerateToken(req.ChannelName, req.UID, role, 86400) // valid for 24 hours
	if err != nil {
		http.Error(w, "Token generation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
		"channel": req.ChannelName,
		"uid":     req.UID,
	})
}

// 4. Host Controls: Lock Meeting Chat
type LockChatRequest struct {
	MeetingID string `json:"meeting_id"`
	Lock      bool   `json:"lock"`
}

func (s *Server) LockMeetingChat(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	user := middleware.GetUserFromContext(r.Context())
	if user == nil || (user.Role != models.RoleAdmin && user.Domain != "Teacher") {
		http.Error(w, "Host privileges required", http.StatusForbidden)
		return
	}

	var req LockChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update meeting chat state
	_, err := s.db.DB.Exec("UPDATE meetings SET is_chat_locked = $1 WHERE id = $2", req.Lock, req.MeetingID)
	if err != nil {
		http.Error(w, "Failed to update chat state", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"locked":  req.Lock,
		"message": "Chat status updated successfully",
	})
}
