package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

func main() {
	log.Println("🚀 Starting API")

	// Kubernetes in-cluster config
	config, err := rest.InClusterConfig()
	if err != nil {
		log.Fatalf("❌ Failed to load in-cluster config: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("❌ Failed to create Kubernetes client: %v", err)
	}

	// Define /startupz endpoint
	http.HandleFunc("/startupz", func(w http.ResponseWriter, r *http.Request) {
		log.Println("⏳ Startup probe hit, checking permissions...")

		_, err := clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{Limit: 1})
		if err != nil {
			log.Printf("❌ Access denied: %v", err)
			http.Error(w, "forbidden", http.StatusInternalServerError)
			return
		}

		log.Println("✅ Access OK")
		fmt.Fprintln(w, "OK")
	})

	// Optionally serve /healthz if needed
	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "always ready") // no check
	})

	port := "8080"
	if os.Getenv("PORT") != "" {
		port = os.Getenv("PORT")
	}
	log.Printf("🌐 Listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
