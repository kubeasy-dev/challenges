package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	log.Println("Available routes:")
	log.Println("  GET /healthz/live → Liveness probe")
	log.Println("  GET /healthz/ready → Readiness probe")
	log.Println("  GET / → Welcome message")
	log.Println("  POST /notify → Send a notification")

	http.HandleFunc("/healthz/live", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	})

	http.HandleFunc("/healthz/ready", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "Ready")
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
