package httpx

import (
	"encoding/json"
	"net/http"
)

// ErrorBody is the consistent shape every API error is returned in.
type ErrorBody struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// EnableCORS sets permissive CORS headers. Since GitHub data is public and the API
// has no auth of its own, allowing any origin keeps this simple to deploy/demo.
func EnableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// JSON writes v as a JSON response with the given status code.
func JSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// Error writes a consistent JSON error envelope.
func Error(w http.ResponseWriter, status int, code, message string) {
	JSON(w, status, ErrorBody{Error: code, Message: message})
}

// HandlePreflight returns true (and has already responded) if this was an OPTIONS
// CORS preflight request that the caller should not process further.
func HandlePreflight(w http.ResponseWriter, r *http.Request) bool {
	EnableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return true
	}
	return false
}
