package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

var (
	isReady bool
	mu      sync.RWMutex
)

func main() {
	log.Println("Starting notify-service initialization...")
	log.Println("Loading configuration and connecting to dependencies...")

	// Simulate slow startup (loading config, connecting to database, etc.)
	go func() {
		time.Sleep(15 * time.Second)
		mu.Lock()
		isReady = true
		mu.Unlock()
		log.Println("Service is now ready to accept traffic")
	}()

	log.Println("Available routes:")
	log.Println("  GET /health/live → Liveness probe")
	log.Println("  GET /health/ready → Readiness probe")
	log.Println("  GET / → Welcome message")
	log.Println("  POST /notify → Send a notification")

	http.HandleFunc("/health/live", func(w http.ResponseWriter, r *http.Request) {
		// Liveness should always pass once the server is running
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "OK")
	})

	http.HandleFunc("/health/ready", func(w http.ResponseWriter, r *http.Request) {
		mu.RLock()
		ready := isReady
		mu.RUnlock()

		if ready {
			w.WriteHeader(http.StatusOK)
			fmt.Fprintln(w, "Ready")
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprintln(w, "Not ready yet")
		}
	})

	http.HandleFunc("/notify", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		log.Println("Received notification request")
		w.WriteHeader(http.StatusAccepted)
		fmt.Fprintln(w, "Notification accepted")
		log.Println("Notification processed successfully")
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.Error(w, "Not found", http.StatusInternalServerError)
			return
		}
		fmt.Fprintln(w, "Welcome to notify-service!")
	})

	port := ":8080"
	log.Println("Starting notify-service on", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Println("Server crashed:", err)
		os.Exit(1)
	}
}
