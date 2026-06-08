package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"backend/internal/config"
	"backend/internal/models"
)

type AIService struct {
	cfg *config.Config
}

func NewAIService(cfg *config.Config) *AIService {
	return &AIService{cfg: cfg}
}

type AIAllocationResult struct {
	Category models.TierCategory `json:"category"`
	Domain   string              `json:"domain"`
	Skills   []string            `json:"skills"`
}

type AIBudgetResult struct {
	SuggestedPayout float64 `json:"suggested_payout"`
	Explanation     string  `json:"explanation"`
}

// CategorizeProfile uses AI to analyze profile description/skills, allocating category (A/B/C) and domain.
func (s *AIService) CategorizeProfile(fullName string, skills []string, bio string) (*AIAllocationResult, error) {
	if s.cfg.AIAPIKey == "" {
		// Fallback Heuristics Engine (Extremely robust rules)
		return s.fallbackCategorize(skills, bio)
	}

	prompt := fmt.Sprintf(`Analyze the following user profile:
Name: %s
Skills: %s
Bio/Description: %s

Assign the user into one of these categories:
- A: Highly experienced, leadership/architect level, specialized skills (e.g., AI/ML, Cloud Architect, Principal Engineer).
- B: Mid-level developer, designer, or specialist (e.g., React Dev, Go Dev, QA lead).
- C: Junior developer, intern, or general worker/student.

Assign a core domain (e.g., "Front-end Developer", "Back-end Developer", "UI/UX Designer", "Machine Learning Engineer", "Researcher", "Content Writer").

Respond STRICTLY with a JSON object in this format:
{
  "category": "A" | "B" | "C",
  "domain": "assigned domain",
  "skills": ["standardized", "skill", "list"]
}`, fullName, strings.Join(skills, ", "), bio)

	var result AIAllocationResult
	err := s.callAI(prompt, &result)
	if err != nil {
		return s.fallbackCategorize(skills, bio)
	}
	return &result, nil
}

// EstimateBudget uses AI to calculate a suggested payout based on task complexity and hours spent.
func (s *AIService) EstimateBudget(taskTitle, taskDesc, complexity string, hoursSpent int) (*AIBudgetResult, error) {
	if s.cfg.AIAPIKey == "" {
		// Fallback Heuristics Engine (Price = f(Complexity, Hours))
		return s.fallbackEstimate(complexity, hoursSpent)
	}

	prompt := fmt.Sprintf(`Calculate a fair project/task payout suggestion:
Task: %s
Description: %s
Complexity: %s (low, medium, high)
Hours Spent: %d

Use the formula: Payout = f(Complexity, Hours).
Standard base rates:
- low: $25/hour
- medium: $50/hour
- high: $100/hour

Provide a suggested payout amount in USD and a brief 1-sentence explanation.
Respond STRICTLY with a JSON object in this format:
{
  "suggested_payout": 123.45,
  "explanation": "Brief reasoning..."
}`, taskTitle, taskDesc, complexity, hoursSpent)

	var result AIBudgetResult
	err := s.callAI(prompt, &result)
	if err != nil {
		return s.fallbackEstimate(complexity, hoursSpent)
	}
	return &result, nil
}

func (s *AIService) callAI(prompt string, out interface{}) error {
	var url string
	var payload []byte
	var err error

	if s.cfg.AIEngine == "claude" {
		url = "https://api.anthropic.com/v1/messages"
		reqBody := map[string]interface{}{
			"model":      "claude-3-opus-20240229",
			"max_tokens": 1000,
			"messages": []map[string]string{
				{"role": "user", "content": prompt},
			},
		}
		payload, err = json.Marshal(reqBody)
	} else {
		// Default to OpenAI
		url = "https://api.openai.com/v1/chat/completions"
		reqBody := map[string]interface{}{
			"model": "gpt-4-turbo",
			"messages": []map[string]string{
				{"role": "system", "content": "You are AuraSuite's embedded AI helper. Return ONLY valid JSON."},
				{"role": "user", "content": prompt},
			},
			"response_format": map[string]string{"type": "json_object"},
		}
		payload, err = json.Marshal(reqBody)
	}

	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	if s.cfg.AIEngine == "claude" {
		req.Header.Set("x-api-key", s.cfg.AIAPIKey)
		req.Header.Set("anthropic-version", "2023-06-01")
	} else {
		req.Header.Set("Authorization", "Bearer "+s.cfg.AIAPIKey)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("AI API returned status %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if s.cfg.AIEngine == "claude" {
		var claudeResp struct {
			Content []struct {
				Text string `json:"text"`
			} `json:"content"`
		}
		if err := json.Unmarshal(bodyBytes, &claudeResp); err != nil {
			return err
		}
		if len(claudeResp.Content) > 0 {
			return json.Unmarshal([]byte(claudeResp.Content[0].Text), out)
		}
	} else {
		var gptResp struct {
			Choices []struct {
				Message struct {
					Content string `json:"content"`
				} `json:"message"`
			} `json:"choices"`
		}
		if err := json.Unmarshal(bodyBytes, &gptResp); err != nil {
			return err
		}
		if len(gptResp.Choices) > 0 {
			return json.Unmarshal([]byte(gptResp.Choices[0].Message.Content), out)
		}
	}

	return fmt.Errorf("empty AI response")
}

func (s *AIService) fallbackCategorize(skills []string, bio string) (*AIAllocationResult, error) {
	// Standardize skills and lower-case text for heuristic matching
	bioLower := strings.ToLower(bio)
	allSkills := []string{}
	for _, sk := range skills {
		allSkills = append(allSkills, strings.ToLower(sk))
	}
	skillStr := strings.Join(allSkills, " ")

	category := models.CategoryC
	domain := "Researcher"

	// Heuristics for category:
	// A: Lead, Principal, Architect, or 5+ skills
	// B: Developer, Senior, Teacher, 3+ skills
	// C: Intern, Junior, Student, low skills
	numSkills := len(skills)
	if strings.Contains(bioLower, "lead") || strings.Contains(bioLower, "architect") || strings.Contains(bioLower, "principal") || numSkills >= 6 {
		category = models.CategoryA
	} else if strings.Contains(bioLower, "senior") || strings.Contains(bioLower, "teacher") || numSkills >= 3 {
		category = models.CategoryB
	}

	// Heuristics for domain:
	if strings.Contains(skillStr, "react") || strings.Contains(skillStr, "next") || strings.Contains(skillStr, "css") || strings.Contains(skillStr, "vue") || strings.Contains(skillStr, "tailwind") {
		domain = "Front-end Developer"
	} else if strings.Contains(skillStr, "go") || strings.Contains(skillStr, "rust") || strings.Contains(skillStr, "node") || strings.Contains(skillStr, "backend") || strings.Contains(skillStr, "postgres") {
		domain = "Back-end Developer"
	} else if strings.Contains(skillStr, "figma") || strings.Contains(skillStr, "design") || strings.Contains(skillStr, "ui") || strings.Contains(skillStr, "ux") {
		domain = "UI/UX Designer"
	} else if strings.Contains(skillStr, "python") || strings.Contains(skillStr, "tensorflow") || strings.Contains(skillStr, "pytorch") || strings.Contains(skillStr, "ai") || strings.Contains(skillStr, "ml") {
		domain = "Machine Learning Engineer"
	} else if strings.Contains(bioLower, "teach") || strings.Contains(bioLower, "educat") || strings.Contains(bioLower, "professor") {
		domain = "Teacher"
	} else if strings.Contains(bioLower, "manufactur") || strings.Contains(bioLower, "factor") || strings.Contains(bioLower, "assembl") {
		domain = "Production Specialist"
	}

	return &AIAllocationResult{
		Category: category,
		Domain:   domain,
		Skills:   skills,
	}, nil
}

func (s *AIService) fallbackEstimate(complexity string, hoursSpent int) (*AIBudgetResult, error) {
	rate := 25.0 // low complexity fallback rate
	compText := "Low"

	switch strings.ToLower(complexity) {
	case "medium":
		rate = 50.0
		compText = "Medium"
	case "high":
		rate = 100.0
		compText = "High"
	}

	payout := float64(hoursSpent) * rate
	explanation := fmt.Sprintf("AI Suggestion (Rule-Based Fallback): Calculated at standard rate of $%g/hr for %s complexity task over %d hour(s).", rate, compText, hoursSpent)

	return &AIBudgetResult{
		SuggestedPayout: payout,
		Explanation:     explanation,
	}, nil
}
}
