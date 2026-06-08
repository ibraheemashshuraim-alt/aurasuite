package models

import (
	"time"
)

type OrganizationType string

const (
	OrgSoftwareHouse OrganizationType = "software_house"
	OrgAcademy       OrganizationType = "academy"
	OrgFactory       OrganizationType = "factory"
)

type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleWorker UserRole = "worker"
	RoleClient UserRole = "client"
)

type TierCategory string

const (
	CategoryA TierCategory = "A"
	CategoryB TierCategory = "B"
	CategoryC TierCategory = "C"
)

type Organization struct {
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	Type      OrganizationType `json:"type"`
	CreatedAt time.Time        `json:"created_at"`
}

type Profile struct {
	ID             string        `json:"id"`
	OrganizationID string        `json:"organization_id"`
	Email          string        `json:"email"`
	FullName       string        `json:"full_name"`
	Role           UserRole      `json:"role"`
	Category       TierCategory  `json:"category,omitempty"`
	Domain         string        `json:"domain,omitempty"`
	Skills         []string      `json:"skills,omitempty"`
	CreatedAt      time.Time     `json:"created_at"`
}

type Project struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organization_id"`
	Name           string    `json:"name"`
	Description    string    `json:"description,omitempty"`
	Status         string    `json:"status"`
	Budget         float64   `json:"budget"`
	CreatedAt      time.Time `json:"created_at"`
}

type Task struct {
	ID                string    `json:"id"`
	ProjectID         string    `json:"project_id"`
	Title             string    `json:"title"`
	Description       string    `json:"description,omitempty"`
	Status            string    `json:"status"`
	AssignedTo        string    `json:"assigned_to,omitempty"`
	Complexity        string    `json:"complexity,omitempty"`
	HoursSpent        int       `json:"hours_spent"`
	SuggestedPayout   float64   `json:"suggested_payout,omitempty"`
	FinalPayout       float64   `json:"final_payout,omitempty"`
	PayoutApproved    bool      `json:"payout_approved"`
	CreatedAt         time.Time `json:"created_at"`
}

type Meeting struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organization_id"`
	HostID         string    `json:"host_id"`
	Title          string    `json:"title"`
	ChannelName    string    `json:"channel_name"`
	Passcode       string    `json:"passcode,omitempty"`
	IsChatLocked   bool      `json:"is_chat_locked"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
}

// Academy structures
type Assignment struct {
	ID             string     `json:"id"`
	OrganizationID string     `json:"organization_id"`
	Title          string     `json:"title"`
	Description    string     `json:"description,omitempty"`
	FileURL        string     `json:"file_url,omitempty"`
	DueDate        *time.Time `json:"due_date,omitempty"`
	CreatedBy      string     `json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
}

type Submission struct {
	ID           string    `json:"id"`
	AssignmentID string    `json:"assignment_id"`
	StudentID    string    `json:"student_id"`
	FileURL      string    `json:"file_url"`
	Grade        string    `json:"grade,omitempty"`
	Feedback     string    `json:"feedback,omitempty"`
	SubmittedAt  time.Time `json:"submitted_at"`
}

// Factory structures
type ProductionLine struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organization_id"`
	Name           string `json:"name"`
	Status         string `json:"status"`
	SupervisorID   string `json:"supervisor_id,omitempty"`
}

type Material struct {
	ID             string `json:"id"`
	OrganizationID string `json:"organization_id"`
	Name           string `json:"name"`
	Quantity       int    `json:"quantity"`
	Unit           string `json:"unit"`
	Status         string `json:"status"`
}

type Attendance struct {
	ID        string     `json:"id"`
	ProfileID string     `json:"profile_id"`
	Date      string     `json:"date"`
	CheckIn   *time.Time `json:"check_in,omitempty"`
	CheckOut  *time.Time `json:"check_out,omitempty"`
	Status    string     `json:"status"`
}
